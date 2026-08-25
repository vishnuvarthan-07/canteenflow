-- This migration updates the accept_order RPC to remove legacy stock decrementing logic.
-- Since the new Daily Food Quantity System dynamically calculates stock based on orders that are placed,
-- the stock is already reserved at the moment the student places the order.
-- Therefore, accepting an order only needs to update its status.

DROP FUNCTION IF EXISTS public.accept_order(UUID);

CREATE OR REPLACE FUNCTION public.accept_order(p_order_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_current_status TEXT;
BEGIN
  -- 1. Fetch current status
  SELECT order_status INTO v_current_status
  FROM public.orders
  WHERE id = p_order_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found.';
  END IF;

  -- 2. Validate state transition
  IF v_current_status IN ('cancelled', 'rejected') THEN
    RAISE EXCEPTION 'Cannot accept a cancelled or rejected order.';
  END IF;
  
  IF v_current_status = 'accepted' THEN
    -- Already accepted, do nothing
    RETURN;
  END IF;

  -- 3. Update the status
  UPDATE public.orders
  SET order_status = 'accepted'
  WHERE id = p_order_id;

END;
$function$;
