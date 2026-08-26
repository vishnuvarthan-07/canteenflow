const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Exports
const exportsToAdd = ['function useCart', 'const usePersisted', 'function Empty', 'type DbPickupSlot', 'const DEFAULT_PROFILE', 'const readStore'];
exportsToAdd.forEach(exp => {
  code = code.replace(new RegExp('(?<!export )' + exp), 'export ' + exp);
});
code = code.replace('export export', 'export');

// 2. Add Missing Imports at top
const topImports = `import { Phone } from "lucide-react";
import { CheckoutPage } from "./CheckoutPage";
import { AdminSettings } from "./AdminSettings";
import { AdminPaymentSettings } from "./AdminPaymentSettings";
import { ContactPage } from "./ContactPage";
import { AdminCanteenProfile as CanteenProfile } from "./CanteenProfile";
`;
code = code.replace(/import \{ type ReactNode/, topImports + 'import { type ReactNode');

// 3. Add Contact route
code = code.replace(/<Route path="\/events">/, '<Route path="/contact"><Shell cartCount={cart.count} unreadCount={notices.filter((n) => !n.is_read).length} canteenStatus={canteenStatus} settings={settings}><ContactPage settings={settings} /></Shell></Route>\n    <Route path="/events">');

// 4. Update DbCanteenSettings Interface
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
  code = code.replace(/export interface Food \{/, interfaceStr + '\nexport interface Food {');
}

// 5. Remove CheckoutPage inline component
const checkoutStart = code.indexOf('function CheckoutPage({ cart, canteenStatus }');
const successStart = code.indexOf('function SuccessPage()');
if (checkoutStart !== -1 && successStart !== -1 && checkoutStart < successStart) {
  code = code.substring(0, checkoutStart) + code.substring(successStart);
}

// 6. Update App component state
code = code.replace(
  /const \[canteenStatus, setCanteenStatus\] = useState<"OPEN" \| "CLOSED">\("OPEN"\);/g,
  'const [canteenStatus, setCanteenStatus] = useState<"OPEN" | "CLOSED">("OPEN");\n  const [settings, setSettings] = useState<DbCanteenSettings | null>(null);'
);
// In case it wasn't replaced (original has no "OPEN" initial state)
code = code.replace(
  /const \[canteenStatus, setCanteenStatus\] = useState<"OPEN" \| "CLOSED">\(\);/g,
  'const [canteenStatus, setCanteenStatus] = useState<"OPEN" | "CLOSED">("OPEN");\n  const [settings, setSettings] = useState<DbCanteenSettings | null>(null);'
);

// 7. Update Shell and Router types
code = code.replace(
  /function Shell\(\{ children, cartCount, unreadCount, canteenStatus \}: \{ children: ReactNode; cartCount: number; unreadCount: number; canteenStatus\?: "OPEN" \| "CLOSED"; \}\) \{/g,
  'function Shell({ children, cartCount, unreadCount, canteenStatus, settings }: { children: ReactNode; cartCount: number; unreadCount: number; canteenStatus?: "OPEN" | "CLOSED"; settings?: any; }) {'
);

code = code.replace(
  /function HashRouter\(\{ profile, foods, cart, eventCart, notices, setNotices, canteenStatus \}: \{/g,
  'function HashRouter({ profile, foods, cart, eventCart, notices, setNotices, canteenStatus, settings }: {'
);

code = code.replace(
  /function WouterRouter\(\{ profile, foods, cart, eventCart, notices, setNotices, canteenStatus \}: \{/g,
  'function WouterRouter({ profile, foods, cart, eventCart, notices, setNotices, canteenStatus, settings }: {'
);

code = code.replace(
  /function Router\(\{ profile, foods, cart, eventCart, notices, setNotices, canteenStatus \}: \{/g,
  'function Router({ profile, foods, cart, eventCart, notices, setNotices, canteenStatus, settings }: {'
);

// Add settings to Router props type (used 3 times in Router/Wouter/Hash)
code = code.replace(/canteenStatus\?: "OPEN" \| "CLOSED";\n\}\) \{/g, 'canteenStatus?: "OPEN" | "CLOSED";\n  settings?: any;\n}) {');

// 8. Add Settings & Payment Tabs to AdminPage
code = code.replace(
  /function AdminPage\(\{ canteenStatus \}: \{ canteenStatus\?: "OPEN" \| "CLOSED"; \}\) \{/g,
  'function AdminPage({ canteenStatus, setSettings }: { canteenStatus?: "OPEN" | "CLOSED"; setSettings?: any; }) {'
);

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

// 10. Pass settings
code = code.replace(
  /<Shell cartCount=\{cart.count\} unreadCount=\{unreadNotices\} canteenStatus=\{canteenStatus\}>/g,
  '<Shell cartCount={cart.count} unreadCount={unreadNotices} canteenStatus={canteenStatus} settings={settings}>'
);
code = code.replace(/<HashRouter profile/g, '<HashRouter settings={settings} profile');
code = code.replace(/<WouterRouter profile/g, '<WouterRouter settings={settings} profile');
code = code.replace(/<Router profile/g, '<Router settings={settings} profile');
code = code.replace(
  /<AdminPage canteenStatus=\{canteenStatus\} \/>/g,
  '<AdminPage canteenStatus={canteenStatus} setSettings={setSettings} />'
);

// 11. Add Contact to Shell links
code = code.replace(
  /\{ href: "\/notifications", label: "Alerts", icon: Bell \}\];/,
  '{ href: "/notifications", label: "Alerts", icon: Bell }, { href: "/contact", label: "Contact", icon: Phone }];'
);

// 12. Fix OrderCard and orderDate
code = code.replace(/\{ order \}: \{ order: Order \}/g, '{ order }: { order: any }');
code = code.replace(/\{o\.orderDate\}/g, '{(o as any).orderDate}');

fs.writeFileSync('src/App.tsx', code);
console.log('App.tsx robust rebuild complete');
