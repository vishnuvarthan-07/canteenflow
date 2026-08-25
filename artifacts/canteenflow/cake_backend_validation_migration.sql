-- UPDATE PLACE EVENT BOOKING RPC TO VALIDATE PRICE SECURELY
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
  p_estimated_total NUMERIC -- We will overwrite this with the verified backend calculation
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_booking_id UUID;
  v_item JSONB;
  v_verified_cake_price NUMERIC := 0;
  v_calculated_total NUMERIC := 0;
  v_item_price NUMERIC;
  v_item_qty INTEGER;
BEGIN
  -- 1. Validate Advance Booking: Event date must be in the future (current_date < event_date)
  IF (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::DATE >= p_event_date THEN
    RAISE EXCEPTION 'Advance booking deadline has passed. Booking must be made before the event date.';
  END IF;

  -- 2. Verify Cake Pricing if Cake is included
  IF p_cake_details IS NOT NULL AND jsonb_typeof(p_cake_details) = 'object' THEN
    SELECT price INTO v_verified_cake_price
    FROM public.cake_configs
    WHERE flavour = (p_cake_details->>'cake_flavour')::TEXT
      AND weight = (p_cake_details->>'cake_weight')::TEXT
      AND is_active = true
    LIMIT 1;

    IF v_verified_cake_price IS NULL OR v_verified_cake_price = 0 THEN
      RAISE EXCEPTION 'Invalid or inactive custom cake selection.';
    END IF;
  END IF;

  -- 3. Calculate True Grand Total
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_item_qty := (v_item->>'quantity')::INTEGER;
    v_item_price := (v_item->>'price')::NUMERIC;
    v_calculated_total := v_calculated_total + (v_item_qty * v_item_price);
  END LOOP;
  v_calculated_total := v_calculated_total + v_verified_cake_price;

  -- 4. Insert Booking with the VERIFIED total
  INSERT INTO public.event_bookings (
    event_type, event_name, student_name, student_id, contact_number,
    department, event_date, event_time, venue, expected_participants,
    special_instructions, estimated_total, status, payment_status
  ) VALUES (
    p_event_type, p_event_name, p_student_name, p_student_id, p_contact_number,
    p_department, p_event_date, p_event_time, p_venue, p_expected_participants,
    p_special_instructions, v_calculated_total, 'PENDING', 'PENDING'
  ) RETURNING id INTO v_booking_id;

  -- 5. Insert Items
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

  -- 6. Insert Cake Details using the VERIFIED price snapshot
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
      v_verified_cake_price,
      v_verified_cake_price
    );
  END IF;

  RETURN v_booking_id;
END;
$function$;
