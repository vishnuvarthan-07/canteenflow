import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://hrfdtlzgicshjqvxpsku.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyZmR0bHpnaWNzaGpxdnhwc2t1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczNDA1NTAsImV4cCI6MjEwMjkxNjU1MH0._Fam7DEZ7Cmb-QKoMG2_4XfJWQpMksYtkG_2b5kBukQ'
);

async function test() {
  const { data, error } = await supabase
    .from('event_bookings')
    .select('*, event_cake_details(*)')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error fetching bookings:', error);
    return;
  }

  console.log(JSON.stringify(data, null, 2));
}

test();
