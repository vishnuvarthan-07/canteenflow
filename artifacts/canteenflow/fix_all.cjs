const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf-8');
let lines = content.split('\n');

// --- 1. Admin Content & Contact UI ---
const requestsBtnIdx = lines.findIndex(l => l.includes('          Registration Requests'));
if (requestsBtnIdx > -1 && !lines[requestsBtnIdx + 2].includes('Content & Contact')) {
    lines.splice(requestsBtnIdx + 2, 0, 
        '        <button onClick={() => setActiveTab(\"content\")} className={`w-full whitespace-nowrap rounded-xl px-4 py-2.5 text-left font-bold ${activeTab === \"content\" ? \"bg-white text-[#ea6b42] shadow-sm\" : \"text-[#7b614b] hover:bg-[#e4d7c6]\"}`}>',
        '          🎨 Content & Contact',
        '        </button>'
    );
}

const mobileRequestsIdx = lines.findIndex(l => l.includes('id: \"requests\", label: \"Requests\"'));
if (mobileRequestsIdx > -1 && !lines[mobileRequestsIdx + 1].includes('id: \"content\"')) {
    lines[mobileRequestsIdx] = lines[mobileRequestsIdx] + ',';
    lines.splice(mobileRequestsIdx + 1, 0,
        '          { id: \"content\", label: \"Content\", icon: FileText }'
    );
}

const adminPanelIdx = lines.findIndex(l => l.includes('<AdminRegistrationRequests />'));
if (adminPanelIdx > -1) {
    const endSectionIdx = adminPanelIdx + 2; // </section>, )}
    if (!lines[endSectionIdx + 1].includes('activeTab === \"content\"')) {
        lines.splice(endSectionIdx + 1, 0,
            '      {activeTab === \"content\" && (',
            '        <section className=\"animate-rise\">',
            '          <AdminSettings currentSettings={settings} onSaved={(updated: any) => { if (setSettings) setSettings((prev: any) => ({ ...prev, ...updated })); }} />',
            '        </section>',
            '      )}'
        );
    }
}

// --- 2. Exports ---
content = lines.join('\n');
content = content.replace('function useCart() {', 'export function useCart() {');
content = content.replace('const usePersisted =', 'export const usePersisted =');
content = content.replace('const readStore =', 'export const readStore =');
content = content.replace('function Empty(', 'export function Empty(');
content = content.replace('type DbPickupSlot =', 'export type DbPickupSlot =');
content = content.replace(/o\.orderDate/g, '(o as any).orderDate');

// --- 3. Imports ---
if (!content.includes('import { ContactPage }')) {
  content = content.replace('import { AuthPage, PendingApprovalPage, RejectedPage } from "./AuthPage";', 'import { AuthPage, PendingApprovalPage, RejectedPage } from "./AuthPage";\nimport { ContactPage } from "./ContactPage";\nimport { AdminSettings } from "./AdminSettings";');
}

if (!content.includes('import { FileText }')) {
  content = content.replace('import {', 'import { FileText, ');
}

// --- 4. Add settings state to App ---
if (!content.includes('const [settings, setSettings]')) {
  content = content.replace(
    'const [canteenStatus, setCanteenStatus] = useState<"OPEN" | "CLOSED">("OPEN");',
    'const [canteenStatus, setCanteenStatus] = useState<"OPEN" | "CLOSED">("OPEN");\n  const [settings, setSettings] = useState<any>(null);'
  );
}

// --- 5. Update supabase query to fetch settings ---
content = content.replace(
  'supabase.from("canteen_settings").select("canteen_status").eq("id", 1).single().then(({ data }) => {\n      if (data) setCanteenStatus(data.canteen_status as "OPEN" | "CLOSED");\n    });',
  `supabase.from("canteen_settings").select("*").eq("id", 1).maybeSingle().then(({ data }) => {\n      if (data) {\n        setCanteenStatus(data.canteen_status as "OPEN" | "CLOSED");\n        setSettings(data);\n      }\n    });`
);

// --- 6. Update Router signature to include settings ---
// Ensure we don't break the string replacement
content = content.replace(
  'function Router({ profile, foods, cart, eventCart, notices, setNotices, canteenStatus }: { profile: any; foods: Food[]; cart: ReturnType<typeof useCart>; eventCart: ReturnType<typeof useEventCart>; notices: Notice[]; setNotices: React.Dispatch<React.SetStateAction<Notice[]>>; canteenStatus?: "OPEN" | "CLOSED" }) {',
  'function Router({ profile, foods, cart, eventCart, notices, setNotices, canteenStatus, settings, setSettings }: { profile: any; foods: Food[]; cart: ReturnType<typeof useCart>; eventCart: ReturnType<typeof useEventCart>; notices: Notice[]; setNotices: React.Dispatch<React.SetStateAction<Notice[]>>; canteenStatus?: "OPEN" | "CLOSED"; settings?: any; setSettings?: any }) {'
);

// --- 7. Pass settings into Router inside App component ---
content = content.replace(
  '<Router profile={profile}',
  '<Router settings={settings} setSettings={setSettings} profile={profile}'
);

// --- 8. Pass settings into Home & AdminPage & Shell ---
content = content.replace('<Home cart={cart} foods={foods} />', '<Home cart={cart} foods={foods} settings={settings} />');
content = content.replace('<AdminPage canteenStatus={canteenStatus} />', '<AdminPage canteenStatus={canteenStatus} settings={settings} setSettings={setSettings} />');

// Update Shell signature
content = content.replace(
  'function Shell({ children, cartCount, unreadCount, canteenStatus }: { children: ReactNode; cartCount: number; unreadCount: number; canteenStatus?: "OPEN" | "CLOSED" }) {',
  'function Shell({ children, cartCount, unreadCount, canteenStatus, settings }: { children: ReactNode; cartCount: number; unreadCount: number; canteenStatus?: "OPEN" | "CLOSED"; settings?: any }) {'
);

// Pass settings to Shell inside Router
// Let's just use string replace on the exact routes
content = content.replace(
  '<Route path="/"><Shell cartCount={cart.count} unreadCount={notices.filter((n) => !n.is_read).length} canteenStatus={canteenStatus}><Home',
  '<Route path="/"><Shell cartCount={cart.count} unreadCount={notices.filter((n) => !n.is_read).length} canteenStatus={canteenStatus} settings={settings}><Home'
);

// Update AdminPage signature
content = content.replace(
  'function AdminPage({ canteenStatus }: { canteenStatus?: "OPEN" | "CLOSED" }) {',
  'function AdminPage({ canteenStatus, settings, setSettings }: { canteenStatus?: "OPEN" | "CLOSED"; settings?: any; setSettings?: any }) {'
);

// --- 9. Add Contact Route ---
if (!content.includes('<Route path="/contact">')) {
  content = content.replace(
    '<Route component={NotFound} />',
    '<Route path="/contact"><ContactPage settings={settings} /></Route>\n        <Route component={NotFound} />'
  );
}

// Add Contact link in Shell links array
if (!content.includes('href: "/contact"')) {
  content = content.replace(
    'const links = [{ href: "/", label: "Home", icon: HomeIcon }, { href: "/menu", label: "Menu", icon: Soup }, { href: "/events", label: "Events", icon: PartyPopper }, { href: "/orders", label: "Orders", icon: ReceiptText }, { href: "/notifications", label: "Alerts", icon: Bell }];',
    'const links = [{ href: "/", label: "Home", icon: HomeIcon }, { href: "/menu", label: "Menu", icon: Soup }, { href: "/events", label: "Events", icon: PartyPopper }, { href: "/orders", label: "Orders", icon: ReceiptText }, { href: "/contact", label: "Contact", icon: Info }, { href: "/notifications", label: "Alerts", icon: Bell }];'
  );
}
if (!content.includes('import { Info }')) {
  content = content.replace('import {', 'import { Info, ');
}

fs.writeFileSync('src/App.tsx', content);

let checkout = fs.readFileSync('src/CheckoutPage.tsx', 'utf-8');
const missingImports = "import { useCart, usePersisted, readStore, Empty, DbPickupSlot } from './App';\n";
if (!checkout.includes('useCart, usePersisted')) {
  checkout = checkout.replace('import { Food, money } from "./App";', missingImports + 'import { Food, money } from "./App";');
}
checkout = checkout.replace('export function FoodVisual({ item, className = "" }) {', 'export function FoodVisual({ item, className = "" }: { item: any, className?: string }) {');
fs.writeFileSync('src/CheckoutPage.tsx', checkout);

console.log('App.tsx and CheckoutPage.tsx patched successfully.');
