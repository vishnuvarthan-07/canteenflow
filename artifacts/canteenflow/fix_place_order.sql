-- This migration fixes the daily token constraint violation in place_order 
-- and restores the "closed" canteen status validation.

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
  v_canteen_status TEXT;
BEGIN
  -- 1. Check Canteen Status
  SELECT canteen_status INTO v_canteen_status FROM public.canteen_settings WHERE id = 1;
  IF v_canteen_status = 'CLOSED' THEN
    RAISE EXCEPTION 'Canteen is currently closed. New orders are not being accepted.';
  END IF;

  -- 2. Determine the business date based on Asia/Kolkata
  v_business_date := (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::DATE;

  -- 3. Construct the globally unique order token string
  -- Reverting to order_token_seq to prevent daily unique constraint violations
  v_order_number := 'canjkkm:' || nextval('public.order_token_seq')::text;

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

-- Make sure the sequence is synced with the max existing order number
SELECT setval('public.order_token_seq', (SELECT COALESCE(MAX(CAST(SPLIT_PART(order_number, ':', 2) AS INTEGER)), 0) FROM public.orders) + 1);
