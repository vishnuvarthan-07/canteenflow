const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf-8');

// Fix duplicate CheckoutPage
const checkoutRegex = /export function CheckoutPage\(\{ profile, foods, cart \}: \{ profile: any; foods: Food\[\]; cart: ReturnType<typeof useCart> \}\) \{[\s\S]*?\}\n\nfunction OrdersPage\(/;
if (checkoutRegex.test(code)) {
    code = code.replace(checkoutRegex, 'function OrdersPage(');
}

// Update Router interface to accept settings
const routerRegex = /function Router\(\{ profile, foods, cart, eventCart, notices, setNotices, canteenStatus \}: \{[\s\S]*?canteenStatus\?: "OPEN" \| "CLOSED";\n\}\) \{/;
const routerRep = `function Router({ profile, foods, cart, eventCart, notices, setNotices, canteenStatus, settings }: {
  profile: any;
  foods: Food[];
  cart: ReturnType<typeof useCart>;
  eventCart: { cart: any; add: any; change: any; remove: any; clear: any; count: number; total: number };
  notices: Notice[];
  setNotices: React.Dispatch<React.SetStateAction<Notice[]>>;
  canteenStatus?: "OPEN" | "CLOSED";
  settings?: DbCanteenSettings | null;
}) {`;
if (routerRegex.test(code)) {
  code = code.replace(routerRegex, routerRep);
}

// Update WouterRouter to accept settings
const wouterRouterRegex = /function WouterRouter\(\{ profile, foods, cart, eventCart, notices, setNotices, canteenStatus \}: \{[\s\S]*?canteenStatus\?: "OPEN" \| "CLOSED";\n\}\) \{/;
const wouterRouterRep = `function WouterRouter({ profile, foods, cart, eventCart, notices, setNotices, canteenStatus, settings }: {
  profile: any;
  foods: Food[];
  cart: ReturnType<typeof useCart>;
  eventCart: { cart: any; add: any; change: any; remove: any; clear: any; count: number; total: number };
  notices: Notice[];
  setNotices: React.Dispatch<React.SetStateAction<Notice[]>>;
  canteenStatus?: "OPEN" | "CLOSED";
  settings?: DbCanteenSettings | null;
}) {`;
if (wouterRouterRegex.test(code)) {
  code = code.replace(wouterRouterRegex, wouterRouterRep);
}

// Update WouterRouter Router call
code = code.replace(
  '<Router profile={profile} foods={foods} cart={cart} eventCart={eventCart} notices={notices} setNotices={setNotices} canteenStatus={canteenStatus} />',
  '<Router profile={profile} foods={foods} cart={cart} eventCart={eventCart} notices={notices} setNotices={setNotices} canteenStatus={canteenStatus} settings={settings} />'
);

// Add readStore export
code = code.replace('function readStore', 'export function readStore');

fs.writeFileSync('App.tsx', code);
console.log('Fixed final TS errors');
