const fs = require('fs');

console.log('--- AdminSettings.tsx ---');
let content = fs.readFileSync('src/AdminSettings.tsx', 'utf-8');
const adminFields = ['canteen_name', 'description', 'phone', 'alternate_phone', 'email', 'address', 'opening_time', 'closing_time', 'working_days', 'whatsapp', 'location_url', 'hero_image', 'hero_badge', 'hero_title', 'hero_highlight', 'hero_description', 'hero_button_text', 'hero_button_link'];
adminFields.forEach(f => console.log(f + ':', content.includes(f)));

console.log('\n--- ContactPage.tsx ---');
content = fs.readFileSync('src/ContactPage.tsx', 'utf-8');
console.log('Fetches supabase:', content.includes('supabase'));
console.log('Fetches canteen_settings:', content.includes('canteen_settings'));
console.log('Has loading state:', content.includes('Loading') || content.includes('loading'));
console.log('Has error handling:', content.includes('error') || content.includes('catch'));

console.log('\n--- Home Hero Section ---');
let app = fs.readFileSync('src/App.tsx', 'utf-8');
const start = app.indexOf('function Home(');
const homeCode = app.substring(start, app.indexOf('function MenuPage('));
const homeFields = ['settings?.hero_image', 'settings?.hero_badge', 'settings?.hero_title', 'settings?.hero_highlight', 'settings?.hero_description', 'settings?.hero_button_text', 'settings?.hero_button_link'];
homeFields.forEach(f => console.log(f + ':', homeCode.includes(f)));

console.log('\n--- Supabase Fetch in App.tsx ---');
console.log('Fetches all settings:', app.includes('select("*")'));
console.log('Uses maybeSingle:', app.includes('maybeSingle'));
console.log('Sets settings state:', app.includes('setSettings(data)'));
