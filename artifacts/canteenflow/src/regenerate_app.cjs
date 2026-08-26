const fs = require('fs');

const orig = fs.readFileSync('src/App.tsx', 'utf-8');

let code = orig;

// 1. Add missing imports
const newImports = `
import { Phone } from "lucide-react";
import { CheckoutPage, SuccessPage } from "./CheckoutPage";
import { AdminSettings } from "./AdminSettings";
import { AdminPaymentSettings } from "./AdminPaymentSettings";
import { ContactPage } from "./ContactPage";
import { AdminCanteenProfile as CanteenProfile } from "./CanteenProfile";
`;
code = code.replace(/import \{ CheckoutPage \} from "\.\/CheckoutPage";/, ''); // Remove the old import if it's there
code = code.replace(/import \{ type ReactNode, useEffect, useMemo, useState \} from "react";/, `import { type ReactNode, useEffect, useMemo, useState } from "react";\n${newImports}`);

// Add Phone to lucide-react if needed (since I already imported Phone from lucide-react above, I can just use it). Wait, the lucide-react import already exists, but importing it again might cause issues or not. Let's just do it right:
code = code.replace(/import \{\n\s*Phone,\n/, 'import {\n'); // in case it was there
code = code.replace(/import \{\n  Bell,/, 'import {\n  Phone,\n  Bell,');

// 2. Add DbCanteenSettings
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
code = code.replace(/export interface Food \{/, interfaceStr + '\nexport interface Food {');

// 3. Remove duplicate CheckoutPage and replace it with just SuccessPage
// Orig has BOTH CheckoutPage and SuccessPage inline.
const checkoutStart = code.indexOf('function CheckoutPage({ cart, canteenStatus }');
const ordersStart = code.indexOf('function OrdersPage({ orders }');

if (checkoutStart !== -1 && ordersStart !== -1) {
  // We need to keep SuccessPage! Let's find SuccessPage inside this block.
  const block = code.substring(checkoutStart, ordersStart);
  const successPageStart = block.indexOf('function SuccessPage()');
  if (successPageStart !== -1) {
    const successPageBlock = block.substring(successPageStart);
    code = code.substring(0, checkoutStart) + successPageBlock + code.substring(ordersStart);
  }
}

// 4. Modify App state
code = code.replace(
  /const \[canteenStatus, setCanteenStatus\] = useState<"OPEN" \| "CLOSED">/,
  'const [canteenStatus, setCanteenStatus] = useState<"OPEN" | "CLOSED">("OPEN");\n  const [settings, setSettings] = useState<DbCanteenSettings | null>(null)'
);

// 5. Update Shell params
code = code.replace(
  /function Shell\(\{ children, cartCount, unreadCount, canteenStatus \}: \{ children: ReactNode; cartCount: number; unreadCount: number; canteenStatus\?: "OPEN" \| "CLOSED"; \}\) \{/,
  'function Shell({ children, cartCount, unreadCount, canteenStatus, settings }: { children: ReactNode; cartCount: number; unreadCount: number; canteenStatus?: "OPEN" | "CLOSED"; settings?: any; }) {'
);

code = code.replace(
  /<Shell cartCount=\{cart.count\} unreadCount=\{unreadNotices\} canteenStatus=\{canteenStatus\}>/g,
  '<Shell cartCount={cart.count} unreadCount={unreadNotices} canteenStatus={canteenStatus} settings={settings}>'
);

// Add Contact to links in Shell
code = code.replace(
  /\{ href: "\/notifications", label: "Alerts", icon: Bell \}/,
  '{ href: "/notifications", label: "Alerts", icon: Bell }, { href: "/contact", label: "Contact", icon: Phone }'
);

// 6. Update HashRouter / Router / WouterRouter
code = code.replace(
  /function HashRouter\(\{ profile, foods, cart, eventCart, notices, setNotices, canteenStatus \}: \{/,
  'function HashRouter({ profile, foods, cart, eventCart, notices, setNotices, canteenStatus, settings }: {'
);
code = code.replace(
  /function WouterRouter\(\{ profile, foods, cart, eventCart, notices, setNotices, canteenStatus \}: \{/,
  'function WouterRouter({ profile, foods, cart, eventCart, notices, setNotices, canteenStatus, settings }: {'
);
code = code.replace(
  /function Router\(\{ profile, foods, cart, eventCart, notices, setNotices, canteenStatus \}: \{/,
  'function Router({ profile, foods, cart, eventCart, notices, setNotices, canteenStatus, settings }: {'
);

code = code.replace(
  /canteenStatus\?: "OPEN" \| "CLOSED";\n\}\) \{/g,
  'canteenStatus?: "OPEN" | "CLOSED";\n  settings?: any;\n}) {'
);

// Add Contact route
code = code.replace(
  /<Route path="\/events">/,
  '<Route path="/contact"><Shell cartCount={cart.count} unreadCount={notices.filter((n) => !n.is_read).length} canteenStatus={canteenStatus} settings={settings}><ContactPage settings={settings} /></Shell></Route>\n    <Route path="/events">'
);

code = code.replace(/<HashRouter profile/g, '<HashRouter settings={settings} profile');
code = code.replace(/<WouterRouter profile/g, '<WouterRouter settings={settings} profile');
code = code.replace(/<Router profile/g, '<Router settings={settings} profile');

// 7. Fix AdminPage call
code = code.replace(
  /<AdminPage canteenStatus=\{canteenStatus\} \/>/,
  '<AdminPage canteenStatus={canteenStatus} setSettings={setSettings} />'
);

// 8. Fix Admin Settings render in AdminPage
const oldAdminRender = `
      {activeTab === "inventory" && <AdminInventory />}
      {activeTab === "requests" && <AdminRequests />}
`;
const newAdminRender = `
      {activeTab === "inventory" && <AdminInventory />}
      {activeTab === "requests" && <AdminRequests />}
      {activeTab === "settings" && <AdminSettings />}
      {activeTab === "payment" && <AdminPaymentSettings />}
`;
code = code.replace(oldAdminRender, newAdminRender);

const adminProps = /function AdminPage\(\{ canteenStatus \}: \{ canteenStatus\?: "OPEN" \| "CLOSED"; \}\) \{/;
const newAdminProps = `function AdminPage({ canteenStatus, setSettings }: { canteenStatus?: "OPEN" | "CLOSED"; setSettings?: any; }) {`;
code = code.replace(adminProps, newAdminProps);

// Settings and Payment buttons in Admin shell
const oldAdminTabs = `
          <button onClick={() => setActiveTab("requests")} className={\`w-full whitespace-nowrap rounded-xl px-4 py-2.5 text-left font-bold \${activeTab === "requests" ? "bg-white text-[#ea6b42] shadow-sm" : "text-[#7b614b] hover:bg-[#e4d7c6]"}\`}>
            Registration Requests
          </button>
        </div>
`;
const newAdminTabs = `
          <button onClick={() => setActiveTab("requests")} className={\`w-full whitespace-nowrap rounded-xl px-4 py-2.5 text-left font-bold \${activeTab === "requests" ? "bg-white text-[#ea6b42] shadow-sm" : "text-[#7b614b] hover:bg-[#e4d7c6]"}\`}>
            Registration Requests
          </button>
          <button onClick={() => setActiveTab("settings")} className={\`w-full whitespace-nowrap rounded-xl px-4 py-2.5 text-left font-bold \${activeTab === "settings" ? "bg-white text-[#ea6b42] shadow-sm" : "text-[#7b614b] hover:bg-[#e4d7c6]"}\`}>
            Settings
          </button>
          <button onClick={() => setActiveTab("payment")} className={\`w-full whitespace-nowrap rounded-xl px-4 py-2.5 text-left font-bold \${activeTab === "payment" ? "bg-white text-[#ea6b42] shadow-sm" : "text-[#7b614b] hover:bg-[#e4d7c6]"}\`}>
            Payment Options
          </button>
        </div>
`;
code = code.replace(oldAdminTabs, newAdminTabs);


// 9. Fix settings fetch
const oldFetch = /supabase\.from\("canteen_settings"\)\.select\("canteen_status"\)\.eq\("id", 1\)\.single\(\)\.then\(\(\{ data \}\) => \{\s*if \(data\) setCanteenStatus\(data\.canteen_status as "OPEN" \| "CLOSED"\);\s*\}\);/;
const newFetch = `supabase.from("canteen_settings").select("*").eq("id", 1).maybeSingle().then(({ data }) => {
      if (data) {
        setCanteenStatus(data.canteen_status as "OPEN" | "CLOSED");
        setSettings(data as DbCanteenSettings);
      } else {
        setSettings({} as DbCanteenSettings);
      }
    });`;
code = code.replace(oldFetch, newFetch);


// 10. Fix orderDate type error
code = code.replace(/\{ order \}: \{ order: Order \}/g, '{ order }: { order: any }');
code = code.replace(/\{o\.orderDate\}/g, '{(o as any).orderDate}');


fs.writeFileSync('src/App.tsx', code);
console.log('Successfully regenerated App.tsx');
