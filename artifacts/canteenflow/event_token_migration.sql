-- 1. Create a table to track daily event token sequence (scoped by event_date)
CREATE TABLE IF NOT EXISTS public.daily_event_tokens (
    event_date DATE PRIMARY KEY,
    last_token INTEGER NOT NULL DEFAULT 0
);

-- 2. Add event_token to event_bookings table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='event_bookings' AND column_name='event_token') THEN
        ALTER TABLE public.event_bookings ADD COLUMN event_token TEXT;
    END IF;
END $$;

-- 3. Backfill event_token for existing orders sequentially by event_date
WITH RankedBookings AS (
  SELECT id, event_date, 
         ROW_NUMBER() OVER (PARTITION BY event_date ORDER BY created_at ASC) as seq
  FROM public.event_bookings
  WHERE event_token IS NULL
)
UPDATE public.event_bookings
SET event_token = 'event:' || RankedBookings.seq::TEXT
FROM RankedBookings
WHERE public.event_bookings.id = RankedBookings.id;

-- 4. Sync up daily_event_tokens with the backfilled values
INSERT INTO public.daily_event_tokens (event_date, last_token)
SELECT event_date, MAX(CAST(REPLACE(event_token, 'event:', '') AS INTEGER))
FROM public.event_bookings
WHERE event_token IS NOT NULL
GROUP BY event_date
ON CONFLICT (event_date) 
DO UPDATE SET last_token = EXCLUDED.last_token;

-- 5. Update place_event_booking to use date-scoped token generation
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
  v_next_token INTEGER;
  v_event_token TEXT;
BEGIN
  -- Validate Advance Booking (1 Day Before)
  v_deadline := p_event_date - INTERVAL '1 day';
  IF CURRENT_DATE > v_deadline THEN
    RAISE EXCEPTION 'Advance booking deadline has passed. Booking must be made at least 1 day before the event.';
  END IF;

  -- 1. Atomically increment the daily token sequence SCOPED BY EVENT DATE
  INSERT INTO public.daily_event_tokens (event_date, last_token)
  VALUES (p_event_date, 1)
  ON CONFLICT (event_date) 
  DO UPDATE SET last_token = public.daily_event_tokens.last_token + 1
  RETURNING last_token INTO v_next_token;

  -- 2. Construct the event token string
  v_event_token := 'event:' || v_next_token::TEXT;

  -- 3. Insert Booking with the generated token
  INSERT INTO public.event_bookings (
    event_token, event_type, event_name, student_name, student_id, contact_number,
    department, event_date, event_time, venue, expected_participants,
    special_instructions, estimated_total, status, payment_status
  ) VALUES (
    v_event_token, p_event_type, p_event_name, p_student_name, p_student_id, p_contact_number,
    p_department, p_event_date, p_event_time, p_venue, p_expected_participants,
    p_special_instructions, p_estimated_total, 'PENDING', 'PENDING'
  ) RETURNING id INTO v_booking_id;

  -- 4. Insert Food/Celebration Items
  IF p_items IS NOT NULL AND jsonb_array_length(p_items) > 0 THEN
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
  END IF;

  -- 5. Insert Cake Details
  IF p_cake_details IS NOT NULL THEN
    INSERT INTO public.event_cake_details (
      event_booking_id, celebration_for, cake_flavour, cake_weight, cake_shape, cake_message
    ) VALUES (
      v_booking_id,
      p_cake_details->>'celebrationFor',
      p_cake_details->>'flavour',
      p_cake_details->>'weight',
      COALESCE(p_cake_details->>'shape', 'Round'), -- Handle shape if omitted
      p_cake_details->>'message'
    );
  END IF;

  RETURN v_booking_id;
END;
$function$;
