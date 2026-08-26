-- 1. Add new columns to canteen_settings
ALTER TABLE public.canteen_settings
  ADD COLUMN IF NOT EXISTS canteen_name TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS alternate_phone TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS opening_time TEXT,
  ADD COLUMN IF NOT EXISTS closing_time TEXT,
  ADD COLUMN IF NOT EXISTS working_days TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp TEXT,
  ADD COLUMN IF NOT EXISTS location_url TEXT,
  ADD COLUMN IF NOT EXISTS hero_image TEXT,
  ADD COLUMN IF NOT EXISTS hero_badge TEXT,
  ADD COLUMN IF NOT EXISTS hero_title TEXT,
  ADD COLUMN IF NOT EXISTS hero_highlight TEXT,
  ADD COLUMN IF NOT EXISTS hero_description TEXT,
  ADD COLUMN IF NOT EXISTS hero_button_text TEXT,
  ADD COLUMN IF NOT EXISTS hero_button_link TEXT,
  ADD COLUMN IF NOT EXISTS live_message TEXT;

-- 2. Populate default values for the existing row (id = 1)
UPDATE public.canteen_settings SET 
  canteen_name = COALESCE(canteen_name, 'CanteenFlow'),
  description = COALESCE(description, 'Fresh meals and snacks prepared daily for students and staff.'),
  phone = COALESCE(phone, '9876543210'),
  alternate_phone = COALESCE(alternate_phone, ''),
  email = COALESCE(email, 'canteen@example.com'),
  address = COALESCE(address, 'College Campus, Tamil Nadu'),
  opening_time = COALESCE(opening_time, '8:00 AM'),
  closing_time = COALESCE(closing_time, '6:00 PM'),
  working_days = COALESCE(working_days, 'Monday – Saturday'),
  whatsapp = COALESCE(whatsapp, ''),
  location_url = COALESCE(location_url, ''),
  hero_image = COALESCE(hero_image, ''),
  hero_badge = COALESCE(hero_badge, 'Straight from the hostel canteen'),
  hero_title = COALESCE(hero_title, 'Skip the queue.'),
  hero_highlight = COALESCE(hero_highlight, 'Keep the good mood.'),
  hero_description = COALESCE(hero_description, 'Your favourite canteen plates, ordered before the bell rings. Pick a window, walk in, walk out.'),
  hero_button_text = COALESCE(hero_button_text, 'Start an order'),
  hero_button_link = COALESCE(hero_button_link, '/menu'),
  live_message = COALESCE(live_message, 'Pickup is moving fast today. Order before the next bell.')
WHERE id = 1;

-- 3. Ensure proper RLS on canteen_settings
ALTER TABLE public.canteen_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anonymous read on canteen_settings" ON public.canteen_settings;
CREATE POLICY "Allow anonymous read on canteen_settings" ON public.canteen_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow admin update on canteen_settings" ON public.canteen_settings;
-- Only authenticated users who have an admin profile can update
CREATE POLICY "Allow admin update on canteen_settings" ON public.canteen_settings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 4. Create storage bucket for Canteen Assets (Images)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('canteen-assets', 'canteen-assets', true)
ON CONFLICT (id) DO NOTHING;

-- 5. Set up RLS for storage.objects
DROP POLICY IF EXISTS "Public Access to Canteen Assets" ON storage.objects;
CREATE POLICY "Public Access to Canteen Assets" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'canteen-assets');

DROP POLICY IF EXISTS "Admin Upload to Canteen Assets" ON storage.objects;
CREATE POLICY "Admin Upload to Canteen Assets" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'canteen-assets' 
  AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Admin Update to Canteen Assets" ON storage.objects;
CREATE POLICY "Admin Update to Canteen Assets" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'canteen-assets' 
  AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Admin Delete to Canteen Assets" ON storage.objects;
CREATE POLICY "Admin Delete to Canteen Assets" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'canteen-assets' 
  AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
