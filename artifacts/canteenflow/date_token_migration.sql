-- 1. Create a table to track daily token sequence
CREATE TABLE IF NOT EXISTS public.daily_order_tokens (
    order_date DATE PRIMARY KEY,
    last_token INTEGER NOT NULL DEFAULT 0
);

-- 2. Add order_date to orders table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='order_date') THEN
        ALTER TABLE public.orders ADD COLUMN order_date DATE;
    END IF;
END $$;

-- 3. Backfill order_date for existing orders using their creation timestamp in Asia/Kolkata
UPDATE public.orders 
SET order_date = (created_at AT TIME ZONE 'Asia/Kolkata')::DATE 
WHERE order_date IS NULL;

-- 4. Update the place_order RPC to use the new daily token logic and store order_date
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
  v_total_capacity INTEGER;
  v_ordered_for_date INTEGER;
  v_remaining_capacity INTEGER;
  v_req_qty INTEGER;
  v_food_name TEXT;
  v_business_date DATE;
  v_next_token INTEGER;
BEGIN
  -- 1. Determine the business date based on Asia/Kolkata
  v_business_date := (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::DATE;

  -- 2. Atomically increment the daily token sequence
  INSERT INTO public.daily_order_tokens (order_date, last_token)
  VALUES (v_business_date, 1)
  ON CONFLICT (order_date) 
  DO UPDATE SET last_token = public.daily_order_tokens.last_token + 1
  RETURNING last_token INTO v_next_token;

  -- 3. Construct the order token string
  v_order_number := 'canjkkm:' || v_next_token::TEXT;

  -- 4. Lock the pickup slot row to prevent race conditions
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

  -- 5. Insert the order with order_date
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
    pickup_slot_id,
    order_date
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
    p_pickup_slot_id,
    v_business_date
  )
  RETURNING id INTO v_order_id;

  -- 6. Create order items and VALIDATE date-specific quantity (only accepted/completed counts)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_req_qty := (v_item->>'quantity')::INTEGER;
    
    -- Get base total capacity
    SELECT total_quantity, name 
    INTO v_total_capacity, v_food_name
    FROM public.foods 
    WHERE id = (v_item->>'food_id')::UUID;
    
    IF NOT FOUND THEN
       RAISE EXCEPTION 'Food item not found.';
    END IF;

    -- Calculate valid stock-consuming orders (accepted/completed)
    SELECT COALESCE(SUM(oi.quantity), 0)
    INTO v_ordered_for_date
    FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    WHERE oi.food_id = (v_item->>'food_id')::UUID
      AND o.pickup_date = p_pickup_date
      AND o.order_status IN ('accepted', 'completed');

    v_remaining_capacity := v_total_capacity - v_ordered_for_date;

    IF v_req_qty > v_remaining_capacity THEN
       RAISE EXCEPTION 'Order exceeds daily available quantity for %.', v_food_name;
    END IF;

    INSERT INTO public.order_items (order_id, food_id, food_name, quantity, price, subtotal)
    VALUES (
      v_order_id, 
      (v_item->>'food_id')::UUID, 
      v_food_name,
      v_req_qty, 
      (v_item->>'price')::NUMERIC, 
      (v_req_qty * (v_item->>'price')::NUMERIC)
    );
  END LOOP;

  RETURN v_order_id;
END;
$function$;
