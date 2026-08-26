-- 1. Add UPI configuration fields to canteen_settings
ALTER TABLE public.canteen_settings
  ADD COLUMN IF NOT EXISTS upi_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS upi_id TEXT,
  ADD COLUMN IF NOT EXISTS upi_account_name TEXT,
  ADD COLUMN IF NOT EXISTS upi_display_name TEXT,
  ADD COLUMN IF NOT EXISTS upi_qr_url TEXT,
  ADD COLUMN IF NOT EXISTS payment_instructions TEXT;

-- Safely backfill default instructions if none exist
UPDATE public.canteen_settings
SET payment_instructions = 'Scan the QR code and pay the exact order amount. After payment, upload the payment screenshot for verification.'
WHERE id = 1 AND (payment_instructions IS NULL OR payment_instructions = '');

-- 2. Add Payment tracking fields to orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'CASH',
  ADD COLUMN IF NOT EXISTS payment_screenshot_url TEXT,
  ADD COLUMN IF NOT EXISTS payment_utr TEXT,
  ADD COLUMN IF NOT EXISTS payment_upi_id_snapshot TEXT,
  ADD COLUMN IF NOT EXISTS payment_account_name_snapshot TEXT,
  ADD COLUMN IF NOT EXISTS payment_rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS payment_verified_at TIMESTAMPTZ;

-- 3. Create the payment-proofs storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'payment-proofs',
    'payment-proofs',
    true, -- Using public url for easy rendering
    5242880, -- 5MB limit
    '{image/png, image/jpeg, image/jpg, image/webp}'
)
ON CONFLICT (id) DO UPDATE SET 
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- RLS Policies for payment-proofs
-- Allow authenticated students to upload proofs
DROP POLICY IF EXISTS "Allow authenticated uploads to payment-proofs" ON storage.objects;
CREATE POLICY "Allow authenticated uploads to payment-proofs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'payment-proofs');

-- Allow authenticated users to read proofs
DROP POLICY IF EXISTS "Allow public/authenticated read for payment-proofs" ON storage.objects;
CREATE POLICY "Allow public/authenticated read for payment-proofs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'payment-proofs');

-- Allow admins to delete proofs
DROP POLICY IF EXISTS "Allow admin delete in payment-proofs" ON storage.objects;
CREATE POLICY "Allow admin delete in payment-proofs"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'payment-proofs' AND (auth.jwt() ->> 'role') = 'admin');
