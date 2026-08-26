-- Fixes the duplicate key value violates unique constraint "orders_order_number_key" error
-- This synchronizes the sequence and daily token tracker with the actual highest order number in the orders table.

-- 1. Sync the daily token tracker for today (if using date_token_migration logic)
UPDATE public.daily_order_tokens
SET last_token = (
    SELECT COALESCE(MAX(CAST(SPLIT_PART(order_number, ':', 2) AS INTEGER)), 0)
    FROM public.orders
    WHERE order_date = public.daily_order_tokens.order_date
)
WHERE order_date = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::DATE;

-- 2. Sync the global sequence just in case (if using the old logic)
SELECT setval('public.order_token_seq', (SELECT COALESCE(MAX(CAST(SPLIT_PART(order_number, ':', 2) AS INTEGER)), 0) FROM public.orders) + 1);
