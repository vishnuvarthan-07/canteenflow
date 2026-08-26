const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// ================================================
// PATCH 1: Add DbCanteenSettings interface
// ================================================
if (!code.includes('interface DbCanteenSettings')) {
  code = code.replace(/export type Food = \{/, `
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

export type Food = {`);
}

// ================================================
// PATCH 2: Add "Content & Contact" button in AdminShell nav
// ================================================
const OLD_NAV = `        <button onClick={() => setActiveTab("requests")} className={\`w-full whitespace-nowrap rounded-xl px-4 py-2.5 text-left font-bold \${activeTab === "requests" ? "bg-white text-[#ea6b42] shadow-sm" : "text-[#7b614b] hover:bg-[#e4d7c6]"}\`}>
          Registration Requests
        </button>
        <div className="pt-4 mt-4 border-t border-white/10 space-y-1.5">`;

const NEW_NAV = `        <button onClick={() => setActiveTab("requests")} className={\`w-full whitespace-nowrap rounded-xl px-4 py-2.5 text-left font-bold \${activeTab === "requests" ? "bg-white text-[#ea6b42] shadow-sm" : "text-[#7b614b] hover:bg-[#e4d7c6]"}\`}>
          Registration Requests
        </button>
        <button onClick={() => setActiveTab("content")} className={\`w-full whitespace-nowrap rounded-xl px-4 py-2.5 text-left font-bold \${activeTab === "content" ? "bg-white text-[#ea6b42] shadow-sm" : "text-[#7b614b] hover:bg-[#e4d7c6]"}\`}>
          🎨 Content & Contact
        </button>
        <div className="pt-4 mt-4 border-t border-white/10 space-y-1.5">`;

if (code.includes(OLD_NAV)) {
  code = code.replace(OLD_NAV, NEW_NAV);
  console.log('✅ Content & Contact button added');
} else {
  console.log('❌ Could not find nav button anchor!');
}

// ================================================
// PATCH 3: Add settings+setSettings to AdminPage props
// ================================================
code = code.replace(
  'function AdminPage({ canteenStatus }: { canteenStatus?: "OPEN" | "CLOSED" }) {',
  'function AdminPage({ canteenStatus, setSettings, settings }: { canteenStatus?: "OPEN" | "CLOSED"; setSettings?: any; settings?: any }) {'
);

// ================================================
// PATCH 4: Add "content" tab panel in AdminPage render
// ================================================
const OLD_END = `      {activeTab === "requests" && (
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

const NEW_END = `      {activeTab === "requests" && (
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

if (code.includes(OLD_END)) {
  code = code.replace(OLD_END, NEW_END);
  console.log('✅ Content tab panel added');
} else {
  console.log('❌ Could not find AdminShell close tag anchor!');
}

// ================================================
// PATCH 5: Add settings state to App
// ================================================
if (!code.includes('[settings, setSettings]')) {
  code = code.replace(
    'const [canteenStatus, setCanteenStatus] = useState<"OPEN" | "CLOSED">("OPEN");',
    'const [canteenStatus, setCanteenStatus] = useState<"OPEN" | "CLOSED">("OPEN");\n  const [settings, setSettings] = useState<DbCanteenSettings | null>(null);'
  );
  code = code.replace(
    'const [canteenStatus, setCanteenStatus] = useState<"OPEN" | "CLOSED">();',
    'const [canteenStatus, setCanteenStatus] = useState<"OPEN" | "CLOSED">("OPEN");\n  const [settings, setSettings] = useState<DbCanteenSettings | null>(null);'
  );
}

// ================================================
// PATCH 6: Update settings fetch to use select("*")
// ================================================
code = code.replace(
  /supabase\.from\("canteen_settings"\)\.select\("canteen_status"\)\.eq\("id", 1\)\.single\(\)\.then\(\(\{ data \}\) => \{\s*if \(data\) setCanteenStatus\(data\.canteen_status as "OPEN" \| "CLOSED"\);\s*\}\);/,
  `supabase.from("canteen_settings").select("*").eq("id", 1).maybeSingle().then(({ data }) => {
      if (data) {
        setCanteenStatus(data.canteen_status as "OPEN" | "CLOSED");
        setSettings(data as DbCanteenSettings);
      } else {
        setSettings({} as DbCanteenSettings);
      }
    });`
);

// ================================================
// PATCH 7: Pass settings to Router
// ================================================
code = code.replace(
  '<Router profile={profile}',
  '<Router settings={settings} setSettings={setSettings} profile={profile}'
);

// ================================================
// PATCH 8: Update Router function signature
// ================================================
code = code.replace(
  'function Router({ profile, foods, cart, eventCart, notices, setNotices, canteenStatus }: { profile: any; foods: Food[]; cart: ReturnType<typeof useCart>; eventCart: ReturnType<typeof useEventCart>; notices: Notice[]; setNotices: React.Dispatch<React.SetStateAction<Notice[]>>; canteenStatus?: "OPEN" | "CLOSED" }) {',
  'function Router({ profile, foods, cart, eventCart, notices, setNotices, canteenStatus, settings, setSettings }: { profile: any; foods: Food[]; cart: ReturnType<typeof useCart>; eventCart: ReturnType<typeof useEventCart>; notices: Notice[]; setNotices: React.Dispatch<React.SetStateAction<Notice[]>>; canteenStatus?: "OPEN" | "CLOSED"; settings?: any; setSettings?: any }) {'
);

// ================================================
// PATCH 9: Pass settings to AdminPage in Router
// ================================================
code = code.replace(
  '<AdminPage canteenStatus={canteenStatus} />',
  '<AdminPage canteenStatus={canteenStatus} setSettings={setSettings} settings={settings} />'
);

// ================================================
// PATCH 10: Add settings to Shell (Shell needs settings? for contact route)
// ================================================
code = code.replace(
  'function Shell({ children, cartCount, unreadCount, canteenStatus }: { children: ReactNode; cartCount: number; unreadCount: number; canteenStatus?: "OPEN" | "CLOSED" }) {',
  'function Shell({ children, cartCount, unreadCount, canteenStatus, settings }: { children: ReactNode; cartCount: number; unreadCount: number; canteenStatus?: "OPEN" | "CLOSED"; settings?: any }) {'
);

// ================================================
// PATCH 11: Add Contact route
// ================================================
if (!code.includes('path="/contact"')) {
  code = code.replace(
    '<Route path="/events">',
    '<Route path="/contact"><Shell cartCount={cart.count} unreadCount={notices.filter((n) => !n.is_read).length} canteenStatus={canteenStatus}><ContactPage settings={settings} /></Shell></Route>\n    <Route path="/events">'
  );
}

// ================================================
// PATCH 12: Pass settings to Home
// ================================================
code = code.replace(
  '<Home cart={cart} foods={foods} />',
  '<Home cart={cart} foods={foods} settings={settings} />'
);

// ================================================
// PATCH 13: Shell needs settings in Home route
// ================================================
// (Already handled by ContactPage route approach above)

fs.writeFileSync('src/App.tsx', code);
console.log('All patches applied!');
