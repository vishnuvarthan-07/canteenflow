INSERT INTO public.canteen_settings (
  id,
  canteen_status,
  canteen_name,
  phone,
  email,
  working_days,
  opening_time,
  closing_time,
  hero_title,
  hero_highlight,
  hero_description
)
VALUES (
  1,
  'OPEN',
  'Smart Canteen',
  '+91 98765 43210',
  'hello@smartcanteen.com',
  'Monday to Saturday',
  '08:00 AM',
  '06:00 PM',
  'Fresh food. Fast pickup.',
  'Keep the good mood.',
  'Your favourite canteen plates, ordered before the bell rings. Pick a window, walk in, walk out.'
)
ON CONFLICT (id) DO UPDATE SET
  canteen_name = EXCLUDED.canteen_name,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  working_days = EXCLUDED.working_days,
  opening_time = EXCLUDED.opening_time,
  closing_time = EXCLUDED.closing_time,
  hero_title = EXCLUDED.hero_title,
  hero_highlight = EXCLUDED.hero_highlight,
  hero_description = EXCLUDED.hero_description;
