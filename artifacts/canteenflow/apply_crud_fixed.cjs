const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. DbCanteenSettings
if (!code.includes('interface DbCanteenSettings')) {
  code = code.replace('export type Food = {', `export interface DbCanteenSettings {
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

export type Food = {`);
}

// 2. Imports
if (!code.includes('ContactPage')) {
  code = code.replace('import NotFound from "@/pages/not-found";', 
  `import NotFound from "@/pages/not-found";
import { ContactPage } from "./ContactPage";
import { AdminSettings } from "./AdminSettings";`);
}

// 3. AdminShell Navigation
const oldNav = `<button onClick={() => setActiveTab("requests")} className={\`w-full whitespace-nowrap rounded-xl px-4 py-2.5 text-left font-bold \${activeTab === "requests" ? "bg-white text-[#ea6b42] shadow-sm" : "text-[#7b614b] hover:bg-[#e4d7c6]"}\`}>
          Registration Requests
        </button>
        <div className="pt-4 mt-4 border-t border-white/10 space-y-1.5">`;
const newNav = `<button onClick={() => setActiveTab("requests")} className={\`w-full whitespace-nowrap rounded-xl px-4 py-2.5 text-left font-bold \${activeTab === "requests" ? "bg-white text-[#ea6b42] shadow-sm" : "text-[#7b614b] hover:bg-[#e4d7c6]"}\`}>
          Registration Requests
        </button>
        <button onClick={() => setActiveTab("content")} className={\`w-full whitespace-nowrap rounded-xl px-4 py-2.5 text-left font-bold \${activeTab === "content" ? "bg-white text-[#ea6b42] shadow-sm" : "text-[#7b614b] hover:bg-[#e4d7c6]"}\`}>
          🎨 Content & Contact
        </button>
        <div className="pt-4 mt-4 border-t border-white/10 space-y-1.5">`;
code = code.replace(oldNav, newNav);

const mobileNavOld = `{ id: "requests", label: "Requests", icon: Users }
      ].map(t => (`;
const mobileNavNew = `{ id: "requests", label: "Requests", icon: Users },
        { id: "content", label: "Content", icon: FileText }
      ].map(t => (`;
code = code.replace(mobileNavOld, mobileNavNew);

// 4. AdminPage signature
code = code.replace(
  'function AdminPage({ canteenStatus }: { canteenStatus?: "OPEN" | "CLOSED" }) {',
  'function AdminPage({ canteenStatus, setSettings, settings }: { canteenStatus?: "OPEN" | "CLOSED"; setSettings?: any; settings?: any }) {'
);

// 5. AdminPage tab panel
const adminClose = `      {activeTab === "requests" && (
        <section className="rounded-2xl border border-[#e3d7c5] bg-[#fffaf0] p-5 animate-rise">
          <h2 className="font-display text-2xl mb-4 flex flex-wrap items-center gap-3">
            Registration Requests
            {pendingRegistrationsCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#ea6b42]/10 px-3 py-1 text-sm font-bold text-[#ea6b42]">
                <Bell size={14} className="animate-pulse" /> {pendingRegistrationsCount} New Requests
              </span>
            )}
          </h2>
          <AdminRegistrationRequests />
        </section>
      )}
    </AdminShell>`;
const adminCloseNew = `      {activeTab === "requests" && (
        <section className="rounded-2xl border border-[#e3d7c5] bg-[#fffaf0] p-5 animate-rise">
          <h2 className="font-display text-2xl mb-4 flex flex-wrap items-center gap-3">
            Registration Requests
            {pendingRegistrationsCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#ea6b42]/10 px-3 py-1 text-sm font-bold text-[#ea6b42]">
                <Bell size={14} className="animate-pulse" /> {pendingRegistrationsCount} New Requests
              </span>
            )}
          </h2>
          <AdminRegistrationRequests />
        </section>
      )}
      {activeTab === "content" && (
        <section className="animate-rise">
          <AdminSettings currentSettings={settings} onSaved={(updated: any) => { if (setSettings) setSettings((prev: any) => ({ ...prev, ...updated })); }} />
        </section>
      )}
    </AdminShell>`;
code = code.replace(adminClose, adminCloseNew);

// 6. Router signature
code = code.replace(
  'function Router({ profile, foods, cart, eventCart, notices, setNotices, canteenStatus }: { profile: any; foods: Food[]; cart: ReturnType<typeof useCart>; eventCart: ReturnType<typeof useEventCart>; notices: Notice[]; setNotices: React.Dispatch<React.SetStateAction<Notice[]>>; canteenStatus?: "OPEN" | "CLOSED" }) {',
  'function Router({ profile, foods, cart, eventCart, notices, setNotices, canteenStatus, settings, setSettings }: { profile: any; foods: Food[]; cart: ReturnType<typeof useCart>; eventCart: ReturnType<typeof useEventCart>; notices: Notice[]; setNotices: React.Dispatch<React.SetStateAction<Notice[]>>; canteenStatus?: "OPEN" | "CLOSED"; settings?: any; setSettings?: any; }) {'
);

// 7. Shell signature
code = code.replace(
  'function Shell({ children, cartCount, unreadCount, canteenStatus }: { children: ReactNode; cartCount: number; unreadCount: number; canteenStatus?: "OPEN" | "CLOSED" }) {',
  'function Shell({ children, cartCount, unreadCount, canteenStatus, settings }: { children: ReactNode; cartCount: number; unreadCount: number; canteenStatus?: "OPEN" | "CLOSED"; settings?: any; }) {'
);

// 8. Contact Route
if (!code.includes('<Route path="/contact">')) {
  code = code.replace(
    '<Route path="/events">',
    '<Route path="/contact"><Shell cartCount={cart.count} unreadCount={notices.filter((n) => !n.is_read).length} canteenStatus={canteenStatus} settings={settings}><ContactPage settings={settings} /></Shell></Route>\n    <Route path="/events">'
  );
}
// 8b. Contact Link in Shell
const oldShellLinks = `const links = [{ href: "/", label: "Home", icon: HomeIcon }, { href: "/menu", label: "Menu", icon: Soup }, { href: "/events", label: "Events", icon: PartyPopper }, { href: "/orders", label: "Orders", icon: ReceiptText }, { href: "/notifications", label: "Alerts", icon: Bell }];`;
const newShellLinks = `const links = [{ href: "/", label: "Home", icon: HomeIcon }, { href: "/menu", label: "Menu", icon: Soup }, { href: "/events", label: "Events", icon: PartyPopper }, { href: "/orders", label: "Orders", icon: ReceiptText }, { href: "/contact", label: "Contact", icon: Info }, { href: "/notifications", label: "Alerts", icon: Bell }];`;
code = code.replace(oldShellLinks, newShellLinks);

// 9. Home signature and Hero
const oldHome = 'function Home({ cart, foods }: { cart: ReturnType<typeof useCart>; foods: Food[] }) {';
const newHome = 'function Home({ cart, foods, settings }: { cart: ReturnType<typeof useCart>; foods: Food[]; settings?: any }) {';
code = code.replace(oldHome, newHome);

code = code.replace('const popular = foods.filter((item) => item.isPopular);', 'const popular = foods.filter((item) => item.isPopular);\n  const s = settings || {};\n  const heroBg: React.CSSProperties = s.hero_image ? { backgroundImage: `url(${s.hero_image})`, backgroundSize: "cover", backgroundPosition: "center" } : {};');

const oldHero = '<section className="relative overflow-hidden rounded-[28px] bg-[#173f37] px-6 py-10 text-[#fff8e8] shadow-warm lg:px-12 lg:py-14"><div className="absolute -right-20 -top-28 size-[330px] rounded-full border-[42px] border-[#f6cb63]/20" /><div className="relative max-w-[670px] animate-rise"><div className="mb-4 inline-flex rounded-full border border-[#f6cb63]/30 bg-[#f6cb63]/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.14em] text-[#f6cb63]">Straight from the hostel canteen</div><h1 className="font-display text-[clamp(3.4rem,7vw,6.8rem)] leading-[.86]">Skip the queue.<br /><em className="text-[#f6cb63]">Keep the good mood.</em></h1><p className="mt-6 max-w-[480px] text-[16px] leading-7 text-[#d5e3d9]">Your favourite canteen plates, ordered before the bell rings. Pick a window, walk in, walk out.</p><Link href="/menu" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#f6cb63] px-5 py-3 text-sm font-bold text-[#173f37]">Start an order <ChevronRight size={16} /></Link></div></section>';
const newHero = '<section className="relative overflow-hidden rounded-[28px] bg-[#173f37] px-6 py-10 text-[#fff8e8] shadow-warm lg:px-12 lg:py-14" style={heroBg}>{s.hero_image && <div className="absolute inset-0 rounded-[28px] bg-[#173f37]/70" />}<div className="absolute -right-20 -top-28 size-[330px] rounded-full border-[42px] border-[#f6cb63]/20" /><div className="relative max-w-[670px] animate-rise"><div className="mb-4 inline-flex rounded-full border border-[#f6cb63]/30 bg-[#f6cb63]/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.14em] text-[#f6cb63]">{s.hero_badge || "Straight from the hostel canteen"}</div><h1 className="font-display text-[clamp(3.4rem,7vw,6.8rem)] leading-[.86]">{s.hero_title || "Skip the queue."}<br /><em className="text-[#f6cb63]">{s.hero_highlight || "Keep the good mood."}</em></h1><p className="mt-6 max-w-[480px] text-[16px] leading-7 text-[#d5e3d9]">{s.hero_description || "Your favourite canteen plates, ordered before the bell rings. Pick a window, walk in, walk out."}</p><Link href={s.hero_button_link || "/menu"} className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#f6cb63] px-5 py-3 text-sm font-bold text-[#173f37]">{s.hero_button_text || "Start an order"} <ChevronRight size={16} /></Link></div></section>';
code = code.replace(oldHero, newHero);

// 10. Pass settings to Home and AdminPage inside Router
code = code.replace('<Home cart={cart} foods={foods} />', '<Home cart={cart} foods={foods} settings={settings} />');
code = code.replace('<AdminPage canteenStatus={canteenStatus} />', '<AdminPage canteenStatus={canteenStatus} settings={settings} setSettings={setSettings} />');

// 11. State and Fetch in App
if (!code.includes('const [settings, setSettings]')) {
  code = code.replace(
    'const [canteenStatus, setCanteenStatus] = useState<"OPEN" | "CLOSED">("OPEN");',
    'const [canteenStatus, setCanteenStatus] = useState<"OPEN" | "CLOSED">("OPEN");\n  const [settings, setSettings] = useState<DbCanteenSettings | null>(null);'
  );
}

const oldFetch = `supabase.from("canteen_settings").select("canteen_status").eq("id", 1).single().then(({ data }) => {
      if (data) setCanteenStatus(data.canteen_status as "OPEN" | "CLOSED");
    });`;
const newFetch = `supabase.from("canteen_settings").select("*").eq("id", 1).maybeSingle().then(({ data }) => {
      if (data) {
        setCanteenStatus(data.canteen_status as "OPEN" | "CLOSED");
        setSettings(data as DbCanteenSettings);
      }
    });`;
code = code.replace(oldFetch, newFetch);

// 12. Router usage in App
code = code.replace('<Router profile={profile}', '<Router settings={settings} setSettings={setSettings} profile={profile}');

// 13. Fix orderDate TS
code = code.replace('Order Date: {o.orderDate}', 'Order Date: {(o as any).orderDate}');

// 14. Export functions needed by CheckoutPage
code = code.replace('function useCart() {', 'export function useCart() {');
code = code.replace('const usePersisted =', 'export const usePersisted =');
code = code.replace('const readStore =', 'export const readStore =');
code = code.replace('function Empty(', 'export function Empty(');
code = code.replace('type DbPickupSlot =', 'export type DbPickupSlot =');

fs.writeFileSync('src/App.tsx', code);
console.log('App.tsx updated correctly!');

// 15. Fix CheckoutPage imports
let checkout = fs.readFileSync('src/CheckoutPage.tsx', 'utf-8');
const missingImports = "import { useCart, usePersisted, readStore, Empty, DbPickupSlot } from './App';\n";
if (!checkout.includes('useCart, usePersisted')) {
  checkout = checkout.replace('import { Food, money } from "./App";', missingImports + 'import { Food, money } from "./App";');
}
checkout = checkout.replace('export function FoodVisual({ item, className = "" }) {', 'export function FoodVisual({ item, className = "" }: { item: any, className?: string }) {');
fs.writeFileSync('src/CheckoutPage.tsx', checkout);
console.log('CheckoutPage.tsx updated!');
