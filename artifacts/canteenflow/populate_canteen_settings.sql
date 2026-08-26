UPDATE canteen_settings
SET
  canteen_name = 'Hostel Canteen',
  description = 'Welcome to the Hostel Canteen. Fresh food, every day.',
  phone = '9876543210',
  email = 'contact@canteenflow.com',
  address = 'Hostel Block A, Campus',
  opening_time = '08:00 AM',
  closing_time = '10:00 PM',
  working_days = 'Monday - Sunday',
  whatsapp = '9876543210',
  hero_title = 'STRAIGHT FROM THE HOSTEL CANTEEN',
  hero_highlight = 'Skip the queue. Keep the good mood.',
  hero_description = 'Order ahead and pick up your favorite meals without the wait.',
  hero_button_text = 'Start an order',
  hero_button_link = '/menu'
WHERE id = 1;
