-- 1. Create the Dynamic Daily Food View for UI Display (ONLY counting accepted/completed)
CREATE OR REPLACE VIEW public.foods_daily AS
SELECT 
  f.id,
  f.name,
  f.description,
  f.price,
  f.category,
  f.food_type,
  f.image_url,
  f.is_available,
  f.created_at,
  f.updated_at,
  f.session,
  f.total_quantity,
  -- Calculate ordered today (ONLY accepted or completed orders consume stock)
  COALESCE((
    SELECT SUM(oi.quantity)
    FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    WHERE oi.food_id = f.id
      AND o.pickup_date = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::DATE
      AND o.order_status IN ('accepted', 'completed')
  ), 0)::INTEGER AS ordered_today,
  -- Calculate remaining today
  (f.total_quantity - COALESCE((
    SELECT SUM(oi.quantity)
    FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    WHERE oi.food_id = f.id
      AND o.pickup_date = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::DATE
      AND o.order_status IN ('accepted', 'completed')
  ), 0))::INTEGER AS remaining_today,
  -- Keep available_quantity mapping for frontend compatibility
  (f.total_quantity - COALESCE((
    SELECT SUM(oi.quantity)
    FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    WHERE oi.food_id = f.id
      AND o.pickup_date = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::DATE
      AND o.order_status IN ('accepted', 'completed')
  ), 0))::INTEGER AS available_quantity
FROM public.foods f;

-- 2. Update place_order to only validate against accepted/completed stock
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

  -- Create order items and VALIDATE date-specific quantity
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

-- 3. Update accept_order to validate stock ATOMICALLY at acceptance time
DROP FUNCTION IF EXISTS public.accept_order(UUID);

CREATE OR REPLACE FUNCTION public.accept_order(p_order_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_current_status TEXT;
  v_pickup_date DATE;
  v_item RECORD;
  v_total_capacity INTEGER;
  v_ordered_for_date INTEGER;
  v_remaining_capacity INTEGER;
  v_food_name TEXT;
BEGIN
  -- 1. Fetch current status and date atomically
  SELECT order_status, pickup_date INTO v_current_status, v_pickup_date
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE; -- Lock the order to prevent concurrent updates
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found.';
  END IF;

  -- 2. Validate state transition
  IF v_current_status IN ('cancelled', 'rejected') THEN
    RAISE EXCEPTION 'Cannot accept a cancelled or rejected order.';
  END IF;
  
  IF v_current_status = 'accepted' THEN
    -- Already accepted, do nothing to prevent double consumption
    RETURN;
  END IF;

  -- 3. Validate stock for each item in the order atomically
  FOR v_item IN 
    SELECT food_id, food_name, quantity 
    FROM public.order_items 
    WHERE order_id = p_order_id
  LOOP
    -- Get base total capacity
    SELECT total_quantity, name 
    INTO v_total_capacity, v_food_name
    FROM public.foods 
    WHERE id = v_item.food_id;
    
    IF NOT FOUND THEN
       RAISE EXCEPTION 'Food item % not found.', v_item.food_name;
    END IF;

    -- Calculate valid orders ALREADY accepted/completed for this specific date
    SELECT COALESCE(SUM(oi.quantity), 0)
    INTO v_ordered_for_date
    FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    WHERE oi.food_id = v_item.food_id
      AND o.pickup_date = v_pickup_date
      AND o.order_status IN ('accepted', 'completed')
      AND o.id != p_order_id; -- Ensure we don't double count if we somehow accepted it

    v_remaining_capacity := v_total_capacity - v_ordered_for_date;

    IF v_item.quantity > v_remaining_capacity THEN
       RAISE EXCEPTION 'Insufficient stock for food item: % (Required: %, Available: %)', 
          v_food_name, v_item.quantity, v_remaining_capacity;
    END IF;
  END LOOP;

  -- 4. Update the status to 'accepted'
  -- This makes it instantly part of the 'accepted' pool, consuming stock.
  UPDATE public.orders
  SET order_status = 'accepted'
  WHERE id = p_order_id;

END;
$function$;
