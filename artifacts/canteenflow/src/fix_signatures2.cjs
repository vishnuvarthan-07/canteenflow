const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Fix DbCanteenSettings not being added correctly
const interfaceStr = `
export interface DbCanteenSettings {
  id: number;
  canteen_status: "OPEN" | "CLOSED";
  canteen_name: string;
  description: string;
  phone: string;
  alternate_phone: string;
  email: string;
  address: string;
  opening_time: string;
  closing_time: string;
  working_days: string;
  whatsapp: string;
  location_url: string;
  hero_image: string;
  hero_badge: string;
  hero_title: string;
  hero_highlight: string;
  hero_description: string;
  hero_button_text: string;
  hero_button_link: string;
  live_message: string;
  upi_enabled: boolean;
  upi_id: string;
  upi_account_name: string;
  upi_display_name: string;
  upi_qr_url: string;
  payment_instructions: string;
}
`;
if (!code.includes('interface DbCanteenSettings')) {
  code = code.replace(/export type Food = \{/, interfaceStr + '\nexport type Food = {');
}

// 2. Fix Shell
code = code.replace(
  /canteenStatus\?: "OPEN" \| "CLOSED"\s*\}\)\s*\{/g,
  'canteenStatus?: "OPEN" | "CLOSED"; settings?: any }) {'
);

// Wait, the above regex replaces AdminPage too!
// Let's explicitly replace Shell
code = code.replace(
  /function Shell\(\{ children, cartCount, unreadCount, canteenStatus, settings \}: \{ children: ReactNode; cartCount: number; unreadCount: number; canteenStatus\?: "OPEN" \| "CLOSED"\s*\}\)/,
  'function Shell({ children, cartCount, unreadCount, canteenStatus, settings }: { children: ReactNode; cartCount: number; unreadCount: number; canteenStatus?: "OPEN" | "CLOSED"; settings?: any })'
);

code = code.replace(
  /function Shell\(\{ children, cartCount, unreadCount, canteenStatus \}: \{ children: ReactNode; cartCount: number; unreadCount: number; canteenStatus\?: "OPEN" \| "CLOSED"\s*\}\)/,
  'function Shell({ children, cartCount, unreadCount, canteenStatus, settings }: { children: ReactNode; cartCount: number; unreadCount: number; canteenStatus?: "OPEN" | "CLOSED"; settings?: any })'
);

// 3. Fix AdminPage
code = code.replace(
  /function AdminPage\(\{ canteenStatus, setSettings \}: \{ canteenStatus\?: "OPEN" \| "CLOSED"\s*\}\)/,
  'function AdminPage({ canteenStatus, setSettings }: { canteenStatus?: "OPEN" | "CLOSED"; setSettings?: any })'
);
code = code.replace(
  /function AdminPage\(\{ canteenStatus \}: \{ canteenStatus\?: "OPEN" \| "CLOSED"\s*\}\)/,
  'function AdminPage({ canteenStatus, setSettings }: { canteenStatus?: "OPEN" | "CLOSED"; setSettings?: any })'
);

// 4. Fix HashRouter, WouterRouter, Router
code = code.replace(
  /canteenStatus\?: "OPEN" \| "CLOSED"\s*\}\)\s*\{/g,
  'canteenStatus?: "OPEN" | "CLOSED"; settings?: any }) {'
);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed signatures via regex!');
