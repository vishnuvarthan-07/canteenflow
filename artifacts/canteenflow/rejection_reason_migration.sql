-- Add rejection_reason to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
