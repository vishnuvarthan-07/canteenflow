const fs = require('fs');

// Fix App.tsx
let appCode = fs.readFileSync('App.tsx', 'utf-8');
const exportsToAdd = ['function useCart', 'const usePersisted', 'function Empty', 'type DbPickupSlot', 'function DEFAULT_PROFILE'];

exportsToAdd.forEach(exp => {
  if (!appCode.includes('export ' + exp) && appCode.includes(exp)) {
    appCode = appCode.replace(exp, 'export ' + exp);
  }
});

appCode = appCode.replace(/function OrderCard\(\{ order \}: \{ order: Order \}\)/g, 'function OrderCard({ order }: { order: any })');

fs.writeFileSync('App.tsx', appCode);

// Fix CheckoutPage.tsx
let checkoutCode = fs.readFileSync('CheckoutPage.tsx', 'utf-8');
checkoutCode = checkoutCode.replace(/cart\.cart\.map\(\(item\) =>/g, 'cart.cart.map((item: any) =>');
fs.writeFileSync('CheckoutPage.tsx', checkoutCode);

console.log('Fixed missing exports and types');
