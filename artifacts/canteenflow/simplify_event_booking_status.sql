-- 1. Drop old constraint
ALTER TABLE public.event_bookings DROP CONSTRAINT IF EXISTS event_bookings_status_check;

-- 2. Add new constraint allowing old statuses AND the new 'ACCEPTED' status so legacy rows aren't broken at the DB level
ALTER TABLE public.event_bookings ADD CONSTRAINT event_bookings_status_check CHECK (status IN ('PENDING', 'ACCEPTED', 'CONFIRMED', 'REJECTED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'));

-- 3. Create a trigger to strictly enforce ONLY 'PENDING', 'ACCEPTED', 'CANCELLED' for new inserts or status updates
CREATE OR REPLACE FUNCTION public.check_strict_event_booking_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status NOT IN ('PENDING', 'ACCEPTED', 'CANCELLED') THEN
    RAISE EXCEPTION 'Invalid Event Booking status: %. Only PENDING, ACCEPTED, and CANCELLED are allowed.', NEW.status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_strict_event_booking_status ON public.event_bookings;
CREATE TRIGGER trg_strict_event_booking_status
BEFORE INSERT OR UPDATE OF status
ON public.event_bookings
FOR EACH ROW
EXECUTE FUNCTION public.check_strict_event_booking_status();
