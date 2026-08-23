import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8');
const urlMatch = env.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

if(urlMatch && keyMatch) {
  const url = urlMatch[1].trim();
  const key = keyMatch[1].trim();
  
  fetch(`${url}/rest/v1/foods?select=*`, {
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
  })
  .then(r => r.json())
  .then(data => {
    fs.writeFileSync('foods_dump.json', JSON.stringify(data, null, 2));
    console.log(`Dumped ${data.length} records to foods_dump.json`);
  })
  .catch(console.error);
}
