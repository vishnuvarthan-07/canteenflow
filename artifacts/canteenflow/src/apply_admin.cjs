const fs = require('fs');

let content = fs.readFileSync('App.tsx', 'utf-8');

// 1. Add import
if (!content.includes('import { AdminSettings } from "./AdminSettings";')) {
  content = content.replace(
    'import { EventBookingIntro, EventBookingWizard, MyEventBookingsPage, AdminEventBookings, AdminCelebrationItems, AdminCakeConfigs } from "./EventBooking";',
    'import { EventBookingIntro, EventBookingWizard, MyEventBookingsPage, AdminEventBookings, AdminCelebrationItems, AdminCakeConfigs } from "./EventBooking";\nimport { AdminSettings } from "./AdminSettings";'
  );
}

// 2. Add Settings button to AdminShell
if (!content.includes('setActiveTab("settings")')) {
  content = content.replace(
    '<button onClick={() => setActiveTab("requests")} className={`w-full whitespace-nowrap rounded-xl px-4 py-2.5 text-left font-bold ${activeTab === "requests" ? "bg-white text-[#ea6b42] shadow-sm" : "text-[#7b614b] hover:bg-[#e4d7c6]"}`}>\n          Registration Requests\n        </button>',
    '<button onClick={() => setActiveTab("requests")} className={`w-full whitespace-nowrap rounded-xl px-4 py-2.5 text-left font-bold ${activeTab === "requests" ? "bg-white text-[#ea6b42] shadow-sm" : "text-[#7b614b] hover:bg-[#e4d7c6]"}`}>\n          Registration Requests\n        </button>\n        <button onClick={() => setActiveTab("settings")} className={`w-full whitespace-nowrap rounded-xl px-4 py-2.5 text-left font-bold ${activeTab === "settings" ? "bg-white text-[#ea6b42] shadow-sm" : "text-[#7b614b] hover:bg-[#e4d7c6]"}`}>\n          Settings\n        </button>'
  );
}

// 3. AdminPage accepts settings
if (!content.includes('function AdminPage({ canteenStatus, settings }')) {
  content = content.replace(
    'function AdminPage({ canteenStatus }: { canteenStatus?: "OPEN" | "CLOSED" }) {',
    'function AdminPage({ canteenStatus, settings }: { canteenStatus?: "OPEN" | "CLOSED"; settings?: DbCanteenSettings | null }) {'
  );
}

// 4. AdminPage render AdminSettings
if (!content.includes('<AdminSettings currentSettings={settings} />')) {
  content = content.replace(
    '{activeTab === "requests" && <AdminRequests />}',
    '{activeTab === "requests" && <AdminRequests />}\n      {activeTab === "settings" && <AdminSettings currentSettings={settings} />}'
  );
}

// 5. Shell accepts settings
if (!content.includes('settings?: DbCanteenSettings | null')) {
  content = content.replace(
    'function Shell({ children, cartCount, unreadCount, canteenStatus }: { children: ReactNode; cartCount: number; unreadCount: number; canteenStatus?: "OPEN" | "CLOSED" }) {',
    'function Shell({ children, cartCount, unreadCount, canteenStatus, settings }: { children: ReactNode; cartCount: number; unreadCount: number; canteenStatus?: "OPEN" | "CLOSED"; settings?: DbCanteenSettings | null }) {'
  );
}

// 6. Shell dynamic live_message
if (content.includes('Pickup is moving fast today. Order before the next bell.')) {
  content = content.replace(
    '<p className="mt-2 text-sm leading-5 text-[#d2e1d7]">Pickup is moving fast today. Order before the next bell.</p>',
    '<p className="mt-2 text-sm leading-5 text-[#d2e1d7]">{settings?.live_message || "Pickup is moving fast today. Order before the next bell."}</p>'
  );
}

// 7. Pass settings to Shell and AdminPage inside Router
content = content.replace(/<Shell cartCount={cart\.count} unreadCount={notices\.filter\(\(n\) => !n\.is_read\)\.length} canteenStatus={canteenStatus}>/g, '<Shell cartCount={cart.count} unreadCount={notices.filter((n) => !n.is_read).length} canteenStatus={canteenStatus} settings={settings}>');
content = content.replace(/<AdminPage canteenStatus={canteenStatus} \/>/g, '<AdminPage canteenStatus={canteenStatus} settings={settings} />');
content = content.replace(/<CheckoutPage cart={cart} canteenStatus={canteenStatus} \/>/g, '<CheckoutPage cart={cart} canteenStatus={canteenStatus} settings={settings} />');

fs.writeFileSync('App.tsx', content);
console.log('Admin settings applied.');
