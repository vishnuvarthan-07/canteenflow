import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8');
const urlMatch = env.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

const url = urlMatch[1].trim();
const key = keyMatch[1].trim();

const headers = { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' };

const foodsToInsert = [
  {
    "id": "6c956886-06fe-471e-a1d3-1bd636e88c9e",
    "name": "Masala Dosa",
    "description": "Crispy dosa served with spicy potato masala",
    "price": 50,
    "image_url": "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=900&q=85",
    "food_type": "veg",
    "available_quantity": 30,
    "is_available": true
  },
  {
    "id": "c9bda7ea-8244-422c-8731-f0ca8ca9a516",
    "name": "Veg Fried Rice",
    "description": "Fresh vegetable fried rice",
    "price": 80,
    "image_url": "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=900&q=85",
    "food_type": "veg",
    "available_quantity": 40,
    "is_available": true
  },
  {
    "id": "8d65789a-7483-403e-9aa6-9090d78b60a1",
    "name": "Chicken Fried Rice",
    "description": "Spicy chicken fried rice",
    "price": 100,
    "image_url": "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=900&q=85",
    "food_type": "non_veg",
    "available_quantity": 35,
    "is_available": true
  },
  {
    "id": "a1a3a3df-1f23-4371-b6bd-5aa86e8874f9",
    "name": "Chicken Biryani",
    "description": "Special chicken biryani",
    "price": 120,
    "image_url": "https://images.unsplash.com/photo-1563379091339-03246963d51a?auto=format&fit=crop&w=900&q=85",
    "food_type": "non_veg",
    "available_quantity": 25,
    "is_available": true
  },
  {
    "id": "9600b39d-8447-44cb-810c-6ac30cc3c4aa",
    "name": "Veg Puff",
    "description": "Freshly baked vegetable puff",
    "price": 20,
    "image_url": "https://images.unsplash.com/photo-1626248937172-358cbff190fc?auto=format&fit=crop&w=900&q=85",
    "food_type": "veg",
    "available_quantity": 40,
    "is_available": true
  },
  {
    "id": "80701fa9-afd4-410f-aec9-c98079f958fa",
    "name": "Coffee",
    "description": "Hot filter coffee",
    "price": 15,
    "image_url": "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=900&q=85",
    "food_type": "veg",
    "available_quantity": 100,
    "is_available": true
  },
  {
    "id": "57a10597-cca7-463c-89a8-8321676c1e5b",
    "name": "Fresh Lime Juice",
    "description": "Freshly prepared lime juice",
    "price": 30,
    "image_url": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=900&q=85",
    "food_type": "veg",
    "available_quantity": 50,
    "is_available": true
  },
  {
    "id": "09454f19-5ba1-4d8c-99ff-61e37f9b186a",
    "name": "Idli",
    "description": "Soft steamed idli with sambar and chutney",
    "price": 30,
    "image_url": "https://images.unsplash.com/photo-1589301760014-d929f39ce9b1?auto=format&fit=crop&w=900&q=85",
    "food_type": "veg",
    "available_quantity": 50,
    "is_available": true
  }
];

async function run() {
  const res = await fetch(`${url}/rest/v1/foods`, {
    method: 'POST',
    headers: { ...headers, 'Prefer': 'return=minimal' },
    body: JSON.stringify(foodsToInsert)
  });
  console.log(`Insert status: ${res.status}`);
  const txt = await res.text();
  if (txt) console.log(txt);
}
run();
