import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hrfdtlzgicshjqvxpsku.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyZmR0bHpnaWNzaGpxdnhwc2t1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczNDA1NTAsImV4cCI6MjEwMjkxNjU1MH0._Fam7DEZ7Cmb-QKoMG2_4XfJWQpMksYtkG_2b5kBukQ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function seedSettings() {
  const { data, error } = await supabase
    .from('canteen_settings')
    .upsert({
      id: 1,
      canteen_name: 'Hostel Canteen',
      description: 'Welcome to the Hostel Canteen. Fresh food, every day.',
      phone: '9876543210',
      email: 'contact@canteenflow.com',
      address: 'Hostel Block A, Campus',
      opening_time: '08:00 AM',
      closing_time: '10:00 PM',
      working_days: 'Monday - Sunday',
      whatsapp: '9876543210',
      hero_title: 'STRAIGHT FROM THE HOSTEL CANTEEN',
      hero_highlight: 'Skip the queue. Keep the good mood.',
      hero_description: 'Order ahead and pick up your favorite meals without the wait.',
      hero_button_text: 'Start an order',
      hero_button_link: '/menu'
    });

  if (error) {
    console.error('Error seeding settings:', error);
  } else {
    console.log('Successfully seeded settings:', data);
  }
}

seedSettings();
