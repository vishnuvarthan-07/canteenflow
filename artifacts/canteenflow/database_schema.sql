-- ==========================================
-- CANTEENFLOW FULL DATABASE SCHEMA
-- ==========================================
-- WARNING: This script drops the existing orders, order_items, and pickup_slots tables.
-- This guarantees a clean slate that perfectly matches your React frontend.

-- 1. DROP EXISTING TABLES AND FUNCTIONS (To clear out all conflicts and bad constraints)
DO $$
DECLARE
    row record;
BEGIN
    FOR row IN
        SELECT oid::regprocedure AS func_signature
        FROM pg_proc
        WHERE proname = 'place_order' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || row.func_signature || ' CASCADE';
    END LOOP;
END;
$$;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.pickup_slots CASCADE;

-- 2. CREATE PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  department TEXT NOT NULL,
  hostel_type TEXT NOT NULL, -- 'boys' or 'girls'
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2.1 CREATE SEQUENCE FOR TOKENS
CREATE SEQUENCE IF NOT EXISTS public.order_token_seq START 1;

-- 3. CREATE PICKUP SLOTS TABLE
CREATE TABLE public.pickup_slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slot_type TEXT NOT NULL DEFAULT 'CUSTOM',
  slot_name TEXT,
  slot_date DATE,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT pickup_slots_type_check CHECK (slot_type IN ('DAILY', 'CUSTOM'))
);

-- 4. CREATE ORDERS TABLE
CREATE TABLE public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  account_owner_id UUID REFERENCES public.profiles(id),
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  recipient_name TEXT,
  recipient_phone TEXT,
  recipient_hostel TEXT,
  delivery_address TEXT,
  total_amount NUMERIC NOT NULL,
  order_status TEXT NOT NULL DEFAULT 'placed',
  pickup_time TEXT NOT NULL,
  pickup_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  pickup_slot_id UUID REFERENCES public.pickup_slots(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT orders_order_status_check CHECK (order_status IN ('placed', 'accepted', 'preparing', 'ready', 'completed', 'cancelled')),
  CONSTRAINT orders_payment_status_check CHECK (payment_status IN ('pending', 'paid', 'failed'))
);

-- 4. CREATE LIVE PICKUP SLOTS VIEW
CREATE OR REPLACE VIEW public.live_pickup_slots AS
SELECT * FROM public.pickup_slots;

-- 5. CREATE ORDER ITEMS TABLE
CREATE TABLE public.order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  food_id UUID NOT NULL REFERENCES public.foods(id),
  food_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price NUMERIC NOT NULL,
  subtotal NUMERIC NOT NULL
);

-- 6. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pickup_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access for the frontend (You can restrict this later when you add Auth)
DROP POLICY IF EXISTS "Allow anonymous all on profiles" ON public.profiles;
CREATE POLICY "Allow anonymous all on profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous all on pickup_slots" ON public.pickup_slots;
CREATE POLICY "Allow anonymous all on pickup_slots" ON public.pickup_slots FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous all on orders" ON public.orders;
CREATE POLICY "Allow anonymous all on orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous all on order_items" ON public.order_items;
CREATE POLICY "Allow anonymous all on order_items" ON public.order_items FOR ALL USING (true) WITH CHECK (true);

-- 7. CREATE THE BULLETPROOF POSTGRES FUNCTION
CREATE OR REPLACE FUNCTION public.place_order(
  p_account_owner_id UUID,
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_recipient_name TEXT,
  p_recipient_phone TEXT,
  p_recipient_hostel TEXT,
  p_delivery_address TEXT,
  p_pickup_slot_id UUID,
  p_pickup_date DATE,
  p_total_amount NUMERIC,
  p_items JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_is_active BOOLEAN;
  v_order_id UUID;
  v_item JSONB;
  v_pickup_time TEXT;
  v_order_number TEXT;
  v_start_time TEXT;
  v_end_time TEXT;
BEGIN
  -- Generate a sequential token number
  v_order_number := 'canjkkm:' || nextval('public.order_token_seq')::text;

  -- Lock the pickup slot row to prevent race conditions
  SELECT is_active, start_time, end_time
  INTO v_is_active, v_start_time, v_end_time
  FROM public.pickup_slots
  WHERE id = p_pickup_slot_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pickup slot not found.';
  END IF;

  IF NOT v_is_active THEN
    RAISE EXCEPTION 'Pickup slot is no longer active.';
  END IF;

  -- Insert the order
  INSERT INTO public.orders (
    order_number, 
    account_owner_id,
    customer_name, 
    customer_phone, 
    recipient_name,
    recipient_phone,
    recipient_hostel,
    delivery_address,
    total_amount,
    order_status,
    pickup_time,
    pickup_date,
    pickup_slot_id
  )
  VALUES (
    v_order_number,
    p_account_owner_id,
    p_customer_name,
    p_customer_phone,
    p_recipient_name,
    p_recipient_phone,
    p_recipient_hostel,
    p_delivery_address,
    p_total_amount,
    'placed',
    v_start_time || ' - ' || v_end_time,
    p_pickup_date,
    p_pickup_slot_id
  )
  RETURNING id INTO v_order_id;

  -- Create order items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.order_items (order_id, food_id, food_name, quantity, price, subtotal)
    VALUES (
      v_order_id, 
      (v_item->>'food_id')::UUID, 
      (v_item->>'food_name')::TEXT,
      (v_item->>'quantity')::INTEGER, 
      (v_item->>'price')::NUMERIC, 
      ((v_item->>'quantity')::INTEGER * (v_item->>'price')::NUMERIC)
    );
  END LOOP;

  RETURN v_order_id;
END;
$function$;

-- ==========================================
-- EVENT & CELEBRATION ADVANCE BOOKING
-- ==========================================

-- 7. CELEBRATION ITEMS
CREATE TABLE IF NOT EXISTS public.celebration_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 8. EVENT BOOKINGS
CREATE TABLE IF NOT EXISTS public.event_bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  event_name TEXT NOT NULL,
  student_name TEXT NOT NULL,
  student_id TEXT,
  contact_number TEXT NOT NULL,
  department TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_time TEXT NOT NULL,
  venue TEXT NOT NULL,
  expected_participants INTEGER NOT NULL,
  special_instructions TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  payment_status TEXT NOT NULL DEFAULT 'PENDING',
  estimated_total NUMERIC NOT NULL DEFAULT 0,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT event_bookings_status_check CHECK (status IN ('PENDING', 'CONFIRMED', 'REJECTED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED')),
  CONSTRAINT event_bookings_payment_status_check CHECK (payment_status IN ('PENDING', 'PARTIAL', 'PAID', 'REFUNDED'))
);

-- 9. EVENT BOOKING ITEMS
CREATE TABLE IF NOT EXISTS public.event_booking_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_booking_id UUID NOT NULL REFERENCES public.event_bookings(id) ON DELETE CASCADE,
  item_id UUID, -- Can be food_id or celebration_item_id, handled by frontend/logic
  item_name TEXT NOT NULL,
  item_type TEXT NOT NULL, -- 'FOOD' or 'CELEBRATION'
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price NUMERIC NOT NULL,
  subtotal NUMERIC NOT NULL
);

-- 10. EVENT CAKE DETAILS
CREATE TABLE IF NOT EXISTS public.event_cake_details (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_booking_id UUID NOT NULL REFERENCES public.event_bookings(id) ON DELETE CASCADE UNIQUE,
  celebration_for TEXT NOT NULL,
  cake_flavour TEXT NOT NULL,
  cake_weight TEXT NOT NULL,
  cake_shape TEXT NOT NULL,
  cake_message TEXT
);

-- 11. EVENT RLS POLICIES
ALTER TABLE public.celebration_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_booking_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_cake_details ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anonymous all on celebration_items" ON public.celebration_items;
CREATE POLICY "Allow anonymous all on celebration_items" ON public.celebration_items FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous all on event_bookings" ON public.event_bookings;
CREATE POLICY "Allow anonymous all on event_bookings" ON public.event_bookings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous all on event_booking_items" ON public.event_booking_items;
CREATE POLICY "Allow anonymous all on event_booking_items" ON public.event_booking_items FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous all on event_cake_details" ON public.event_cake_details;
CREATE POLICY "Allow anonymous all on event_cake_details" ON public.event_cake_details FOR ALL USING (true) WITH CHECK (true);

-- 12. PLACE EVENT BOOKING RPC
CREATE OR REPLACE FUNCTION public.place_event_booking(
  p_event_type TEXT,
  p_event_name TEXT,
  p_student_name TEXT,
  p_student_id TEXT,
  p_contact_number TEXT,
  p_department TEXT,
  p_event_date DATE,
  p_event_time TEXT,
  p_venue TEXT,
  p_expected_participants INTEGER,
  p_special_instructions TEXT,
  p_items JSONB,
  p_cake_details JSONB,
  p_estimated_total NUMERIC
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_booking_id UUID;
  v_item JSONB;
  v_deadline DATE;
BEGIN
  -- Validate Advance Booking (1 Day Before)
  -- If event_date is Aug 25, deadline is Aug 24. 
  -- If today is Aug 25 (current_date > deadline), reject.
  v_deadline := p_event_date - INTERVAL '1 day';
  IF CURRENT_DATE > v_deadline THEN
    RAISE EXCEPTION 'Advance booking deadline has passed. Booking must be made at least 1 day before the event.';
  END IF;

  -- Insert Booking
  INSERT INTO public.event_bookings (
    event_type, event_name, student_name, student_id, contact_number,
    department, event_date, event_time, venue, expected_participants,
    special_instructions, estimated_total, status, payment_status
  ) VALUES (
    p_event_type, p_event_name, p_student_name, p_student_id, p_contact_number,
    p_department, p_event_date, p_event_time, p_venue, p_expected_participants,
    p_special_instructions, p_estimated_total, 'PENDING', 'PENDING'
  ) RETURNING id INTO v_booking_id;

  -- Insert Items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.event_booking_items (
      event_booking_id, item_id, item_name, item_type, quantity, price, subtotal
    ) VALUES (
      v_booking_id,
      (v_item->>'id')::UUID,
      (v_item->>'name')::TEXT,
      (v_item->>'type')::TEXT,
      (v_item->>'quantity')::INTEGER,
      (v_item->>'price')::NUMERIC,
      ((v_item->>'quantity')::INTEGER * (v_item->>'price')::NUMERIC)
    );
  END LOOP;

  -- Insert Cake Details if present
  IF p_cake_details IS NOT NULL AND jsonb_typeof(p_cake_details) = 'object' THEN
    INSERT INTO public.event_cake_details (
      event_booking_id, celebration_for, cake_flavour, cake_weight, cake_shape, cake_message
    ) VALUES (
      v_booking_id,
      (p_cake_details->>'celebration_for')::TEXT,
      (p_cake_details->>'cake_flavour')::TEXT,
      (p_cake_details->>'cake_weight')::TEXT,
      (p_cake_details->>'cake_shape')::TEXT,
      (p_cake_details->>'cake_message')::TEXT
    );
  END IF;

  RETURN v_booking_id;
END;
$function$;
