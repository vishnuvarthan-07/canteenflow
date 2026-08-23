import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8');
const urlMatch = env.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

const url = urlMatch[1].trim();
const key = keyMatch[1].trim();

const headers = { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' };

const deleteIds = [
  "38ae895f-6cb0-4132-9fcc-2695320ca89f", "d1a64fd4-4569-41a2-be9c-e257b1cd1ba4", "e93557f1-dc0c-4725-b262-f01b1ca9bd74", "673253fd-a5f5-4a8a-9097-b8471faf934b",
  "0fd38a45-1695-4bce-a858-a46a20b2ad3f",
  "5004f92b-e12f-469f-9f98-077572c338d8", "5096d3e2-d11b-4ac5-984c-b90b3bc43286",
  "7d901e43-4da5-43ba-92dd-ab473634da41",
  "53d93263-e04b-429a-a79d-b6fca60ac0a9",
  "23b270e8-83eb-4940-b406-b065d235c252", "06a67b2a-7198-4e8a-a972-de65a0f47eaa",
  "854fda37-31ba-47d1-a9f8-ee0ed4018513"
];

const updates = [
  { id: "6c956886-06fe-471e-a1d3-1bd636e88c9e", image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=900&q=85" },
  { id: "c9bda7ea-8244-422c-8731-f0ca8ca9a516", image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=900&q=85" },
  { id: "8d65789a-7483-403e-9aa6-9090d78b60a1", image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=900&q=85" },
  { id: "a1a3a3df-1f23-4371-b6bd-5aa86e8874f9", image: "https://images.unsplash.com/photo-1563379091339-03246963d51a?auto=format&fit=crop&w=900&q=85" },
  { id: "9600b39d-8447-44cb-810c-6ac30cc3c4aa", image: "https://images.unsplash.com/photo-1626248937172-358cbff190fc?auto=format&fit=crop&w=900&q=85" },
  { id: "80701fa9-afd4-410f-aec9-c98079f958fa", image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=900&q=85" },
  { id: "57a10597-cca7-463c-89a8-8321676c1e5b", image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=900&q=85" },
  { id: "09454f19-5ba1-4d8c-99ff-61e37f9b186a", image: "https://images.unsplash.com/photo-1589301760014-d929f39ce9b1?auto=format&fit=crop&w=900&q=85" }
];

async function run() {
  for (const id of deleteIds) {
    const res = await fetch(`${url}/rest/v1/foods?id=eq.${id}`, { method: 'DELETE', headers });
    console.log(`Deleted ${id}: ${res.status}`);
  }
  for (const u of updates) {
    const res = await fetch(`${url}/rest/v1/foods?id=eq.${u.id}`, {
      method: 'PATCH',
      headers: { ...headers, 'Prefer': 'return=minimal' },
      body: JSON.stringify({ image_url: u.image })
    });
    console.log(`Updated ${u.id}: ${res.status}`);
  }
}
run();
