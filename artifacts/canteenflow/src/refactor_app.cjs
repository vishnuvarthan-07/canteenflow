const fs = require('fs');

let content = fs.readFileSync('App.tsx', 'utf-8');

// 1. Add DbCanteenSettings interface
const dbCanteenSettings = `export interface DbCanteenSettings {
  id: number;
  canteen_status: "OPEN" | "CLOSED";
  upi_enabled?: boolean;
  upi_id?: string;
  upi_account_name?: string;
  upi_display_name?: string;
  upi_qr_url?: string;
  payment_instructions?: string;
  canteen_name?: string;
  description?: string;
  phone?: string;
  alternate_phone?: string;
  email?: string;
  address?: string;
  opening_time?: string;
  closing_time?: string;
  working_days?: string;
  whatsapp?: string;
  location_url?: string;
  hero_image?: string;
  hero_badge?: string;
  hero_title?: string;
  hero_highlight?: string;
  hero_description?: string;
  hero_button_text?: string;
  hero_button_link?: string;
  live_message?: string;
}
`;

if (!content.includes('interface DbCanteenSettings')) {
  // Find a good place to insert, like after imports
  const importEndIndex = content.lastIndexOf('import ');
  const nextLineIndex = content.indexOf('\n', importEndIndex) + 1;
  content = content.slice(0, nextLineIndex) + '\n' + dbCanteenSettings + '\n' + content.slice(nextLineIndex);
}

// 2. Modify App component to use settings
if (!content.includes('const [settings, setSettings] = useState<DbCanteenSettings | null>(null);')) {
  content = content.replace(
    'const [canteenStatus, setCanteenStatus] = useState<"OPEN" | "CLOSED">("OPEN");',
    'const [canteenStatus, setCanteenStatus] = useState<"OPEN" | "CLOSED">("OPEN");\n  const [settings, setSettings] = useState<DbCanteenSettings | null>(null);'
  );
}

// 3. Update useEffect for initial fetch
content = content.replace(
  'supabase.from("canteen_settings").select("canteen_status").eq("id", 1).single().then(({ data }) => {\n      if (data) setCanteenStatus(data.canteen_status as "OPEN" | "CLOSED");\n    });',
  'supabase.from("canteen_settings").select("*").eq("id", 1).single().then(({ data }) => {\n      if (data) {\n        setSettings(data as DbCanteenSettings);\n        setCanteenStatus(data.canteen_status as "OPEN" | "CLOSED");\n      }\n    });'
);

// 4. Update postgres_changes for settings
content = content.replace(
  /const newStatus = payload\.new\.canteen_status as "OPEN" \| "CLOSED";\s*setCanteenStatus\(newStatus\);/g,
  'const newStatus = payload.new.canteen_status as "OPEN" | "CLOSED";\n        setCanteenStatus(newStatus);\n        setSettings(payload.new as DbCanteenSettings);'
);

// 5. Add settings to WouterRouter Router call
content = content.replace(
  /<Router profile={profile} foods={foods} cart={cart} eventCart={eventCart} notices={notices} setNotices={setNotices} canteenStatus={canteenStatus} \/>/g,
  '<Router profile={profile} foods={foods} cart={cart} eventCart={eventCart} notices={notices} setNotices={setNotices} canteenStatus={canteenStatus} settings={settings} />'
);

// 6. Update Router function to pass settings to Home
content = content.replace(
  /<Home cart={cart} foods={foods} \/>/g,
  '<Home cart={cart} foods={foods} settings={settings} />'
);

// 7. Update Home function definition
content = content.replace(
  /function Home\(\{ cart, foods \}: \{ cart: ReturnType<typeof useCart>; foods: Food\[\] \}\) \{/g,
  'function Home({ cart, foods, settings }: { cart: ReturnType<typeof useCart>; foods: Food[]; settings?: DbCanteenSettings | null }) {'
);

fs.writeFileSync('App.tsx', content);
console.log('App.tsx refactored successfully.');
