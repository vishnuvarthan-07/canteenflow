const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Add DbCanteenSettings interface
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
  code = code.replace(/export interface Food \{/, interfaceStr + 'export interface Food {');
}

// 2. Add SuccessPage component
const successPageStr = `
export function SuccessPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-6 text-center">
      <div className="mb-4 grid size-16 place-items-center rounded-full bg-[#eaf2ec] text-[#26735a]">
        <Check size={32} />
      </div>
      <h2 className="font-display text-3xl font-bold text-[#294b41]">Order Placed!</h2>
      <p className="mt-2 text-[#8c745c]">Your order has been successfully sent to the canteen.</p>
      <Link href="/orders" className="mt-6 flex items-center justify-center rounded-xl bg-[#294b41] px-6 py-3 font-bold text-white transition hover:bg-[#1f3a32]">
        View My Orders
      </Link>
    </div>
  );
}
`;
if (!code.includes('function SuccessPage()')) {
  code = code.replace(/function OrdersPage\(/, successPageStr + '\nfunction OrdersPage(');
}

// 3. Fix App component state and Shell
code = code.replace(/const \[canteenStatus, setCanteenStatus\] = useState<"OPEN" \| "CLOSED">/, 'const [canteenStatus, setCanteenStatus] = useState<"OPEN" | "CLOSED">("OPEN");\n  const [settings, setSettings] = useState<DbCanteenSettings | null>(null)');

// 4. Update Shell interface and usage
code = code.replace(
  /function Shell\(\{ children, cartCount, unreadCount, canteenStatus \}: \{[\s\S]*?\} \) \{/,
  'function Shell({ children, cartCount, unreadCount, canteenStatus, settings }: { children: ReactNode; cartCount: number; unreadCount: number; canteenStatus?: "OPEN" | "CLOSED"; settings?: any }) {'
);

code = code.replace(/<Shell cartCount=\{cart\.count\} unreadCount=\{unreadNotices\} canteenStatus=\{canteenStatus\}>/g, '<Shell cartCount={cart.count} unreadCount={unreadNotices} canteenStatus={canteenStatus} settings={settings}>');

// 5. Update Router and HashRouter to accept settings
code = code.replace(
  /canteenStatus\?: "OPEN" \| "CLOSED";\n\}\) \{/g,
  'canteenStatus?: "OPEN" | "CLOSED";\n  settings?: any;\n}) {'
);
code = code.replace(
  /canteenStatus\?: "OPEN" \| "CLOSED";\n\}\)/g,
  'canteenStatus?: "OPEN" | "CLOSED";\n  settings?: any;\n})'
);
code = code.replace(/<HashRouter profile/g, '<HashRouter settings={settings} profile');
code = code.replace(/<WouterRouter profile/g, '<WouterRouter settings={settings} profile');
code = code.replace(/<Router profile/g, '<Router settings={settings} profile');

// 6. Fix CheckoutPage import
code = code.replace(/import \{ CheckoutPage, SuccessPage \} from "\.\/CheckoutPage";/, 'import { CheckoutPage } from "./CheckoutPage";');

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed types and restored SuccessPage');
