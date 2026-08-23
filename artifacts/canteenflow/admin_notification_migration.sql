-- 1. UPDATE NOTIFICATIONS TRIGGER (Remove INSERT logic for NEW_ORDER)
CREATE OR REPLACE FUNCTION public.handle_order_notifications()
RETURNS TRIGGER AS $$
DECLARE
  v_title TEXT;
  v_message TEXT;
  v_type TEXT;
BEGIN
  -- ON UPDATE: Notify Student of status changes
  IF TG_OP = 'UPDATE' AND OLD.order_status IS DISTINCT FROM NEW.order_status THEN
    
    IF NEW.order_status = 'accepted' THEN
      v_title := 'Order Accepted';
      v_message := 'Your order ' || NEW.order_number || ' has been accepted and will be prepared soon.';
      v_type := 'ORDER_ACCEPTED';
    ELSIF NEW.order_status = 'preparing' THEN
      v_title := 'Food ready soon';
      v_message := 'Your order ' || NEW.order_number || ' is being prepared for pickup.';
      v_type := 'ORDER_PREPARING';
    ELSIF NEW.order_status = 'ready' THEN
      v_title := 'Order Ready!';
      v_message := 'Your order ' || NEW.order_number || ' is ready for pickup at the canteen!';
      v_type := 'ORDER_READY';
    ELSIF NEW.order_status = 'completed' THEN
      v_title := 'Order Completed';
      v_message := 'Your order ' || NEW.order_number || ' has been picked up. Enjoy your meal!';
      v_type := 'ORDER_COMPLETED';
    ELSIF NEW.order_status = 'cancelled' THEN
      v_title := 'Order Cancelled';
      v_message := 'Your order ' || NEW.order_number || ' was cancelled.';
      v_type := 'ORDER_CANCELLED';
    END IF;

    IF v_title IS NOT NULL THEN
      INSERT INTO public.notifications (
        recipient_id,
        recipient_role,
        order_id,
        title,
        message,
        notification_type
      ) VALUES (
        NEW.account_owner_id,
        'student',
        NEW.id,
        v_title,
        v_message,
        v_type
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. UPDATE PLACE ORDER RPC
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
  v_canteen_status TEXT;
  
  -- Notification building
  v_items_text TEXT := '';
  v_item_count INTEGER := 0;
  v_total_qty INTEGER := 0;
  v_admin_msg TEXT := '';
BEGIN
  -- Check Canteen Status
  SELECT canteen_status INTO v_canteen_status FROM public.canteen_settings WHERE id = 1;
  IF v_canteen_status = 'CLOSED' THEN
    RAISE EXCEPTION 'Canteen is currently closed. New orders are not being accepted.';
  END IF;

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

  -- Create order items and build string
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
    
    v_item_count := v_item_count + 1;
    v_total_qty := v_total_qty + (v_item->>'quantity')::INTEGER;
    
    IF v_items_text <> '' THEN
      v_items_text := v_items_text || ', ';
    END IF;
    v_items_text := v_items_text || (v_item->>'food_name')::TEXT || ' × ' || (v_item->>'quantity')::TEXT;
  END LOOP;

  -- Build the notification message
  v_admin_msg := 'Order #' || v_order_number || CHR(10);
  
  IF p_customer_name = p_recipient_name THEN
    v_admin_msg := v_admin_msg || p_customer_name || ' ordered ' || v_total_qty || ' items: ' || CHR(10);
  ELSE
    v_admin_msg := v_admin_msg || 'Ordered By: ' || p_customer_name || CHR(10) || 'For: ' || p_recipient_name || CHR(10);
  END IF;
  
  v_admin_msg := v_admin_msg || v_items_text || CHR(10);
  v_admin_msg := v_admin_msg || 'Pickup: ' || v_start_time || ' - ' || v_end_time;

  -- Insert Admin Notification
  INSERT INTO public.notifications (
    recipient_role,
    order_id,
    title,
    message,
    notification_type
  ) VALUES (
    'admin',
    v_order_id,
    'New Order Received',
    v_admin_msg,
    'NEW_ORDER'
  );

  RETURN v_order_id;
END;
$function$;
