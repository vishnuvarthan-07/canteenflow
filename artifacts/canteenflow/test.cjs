const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const urlMatch = env.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/);
if(urlMatch && keyMatch) {
  fetch(`${urlMatch[1].trim()}/rest/v1/foods?select=*&limit=1`, {
    headers: { 'apikey': keyMatch[1].trim(), 'Authorization': `Bearer ${keyMatch[1].trim()}` }
  }).then(r => r.json()).then(console.log);
}
