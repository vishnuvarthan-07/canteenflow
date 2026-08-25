-- 1. Create Cake Configs Table
CREATE TABLE IF NOT EXISTS public.cake_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flavour TEXT NOT NULL,
  weight TEXT NOT NULL,
  price NUMERIC NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS and add public policies so the frontend can read/write
ALTER TABLE public.cake_configs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Enable read access for all users" ON public.cake_configs;
    DROP POLICY IF EXISTS "Enable insert for all users" ON public.cake_configs;
    DROP POLICY IF EXISTS "Enable update for all users" ON public.cake_configs;
    DROP POLICY IF EXISTS "Enable delete for all users" ON public.cake_configs;
EXCEPTION
    WHEN undefined_object THEN
        -- Ignore if policies don't exist
END
$$;

CREATE POLICY "Enable read access for all users" ON public.cake_configs FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.cake_configs FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.cake_configs FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON public.cake_configs FOR DELETE USING (true);

-- Insert initial cake data based on previous hardcoded values
INSERT INTO public.cake_configs (flavour, weight, price) VALUES
('Chocolate', '1 KG', 750),
('Chocolate', '1.5 KG', 1100),
('Chocolate', '2 KG', 1400),
('Chocolate', '3 KG', 2000),
('Black Forest', '1 KG', 800),
('Black Forest', '1.5 KG', 1150),
('Black Forest', '2 KG', 1500),
('Butterscotch', '1 KG', 750),
('Butterscotch', '1.5 KG', 1100),
('Red Velvet', '1 KG', 900),
('Red Velvet', '1.5 KG', 1300)
ON CONFLICT DO NOTHING;

-- 2. Update event_cake_details to support price snapshots
ALTER TABLE public.event_cake_details ADD COLUMN IF NOT EXISTS unit_price NUMERIC;
ALTER TABLE public.event_cake_details ADD COLUMN IF NOT EXISTS total_price NUMERIC;

-- 3. Update the RPC to accept cake pricing and fix timezone usage explicitly for advance booking validation
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
BEGIN
  -- Validate Advance Booking: Event date must be strictly after the current date in Asia/Kolkata timezone
  IF (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::DATE >= p_event_date THEN
    RAISE EXCEPTION 'Advance booking deadline has passed. Booking must be made at least 1 day in advance.';
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
      event_booking_id, celebration_for, cake_flavour, cake_weight, cake_shape, cake_message, unit_price, total_price
    ) VALUES (
      v_booking_id,
      (p_cake_details->>'celebration_for')::TEXT,
      (p_cake_details->>'cake_flavour')::TEXT,
      (p_cake_details->>'cake_weight')::TEXT,
      (p_cake_details->>'cake_shape')::TEXT,
      (p_cake_details->>'cake_message')::TEXT,
      (p_cake_details->>'unit_price')::NUMERIC,
      (p_cake_details->>'total_price')::NUMERIC
    );
  END IF;

  RETURN v_booking_id;
END;
$function$;
