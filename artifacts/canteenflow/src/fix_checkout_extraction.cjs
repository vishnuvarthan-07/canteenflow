const fs = require('fs');

let code = fs.readFileSync('App.tsx', 'utf-8');

const toExport = [
  'const usePersisted', 
  'function useCart', 
  'const DEFAULT_PROFILE', 
  'function readStore', 
  'function money', 
  'function format12Hour', 
  'function Empty', 
  'function PageIntro', 
  'type DbPickupSlot'
];

toExport.forEach(exp => {
  const replacement = exp.startsWith('const') || exp.startsWith('function') || exp.startsWith('type') ? 'export ' + exp : exp;
  code = code.replace(new RegExp('^' + exp.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '\\b', 'm'), replacement);
});

// Since we did a git checkout, the old CheckoutPage component is in App.tsx again.
// We must extract it. The easiest way is to just replace the whole function block.
const checkoutRegex = /export function CheckoutPage\(\{ profile, foods, cart \}: \{ profile: any; foods: Food\[\]; cart: ReturnType<typeof useCart> \}\) \{[\s\S]*?\}\n\nfunction OrdersPage\(/;
if (checkoutRegex.test(code)) {
    code = code.replace(checkoutRegex, 'function OrdersPage(');
}

const importStmt = 'import { CheckoutPage } from "./CheckoutPage";\n';
if (!code.includes('import { CheckoutPage }')) {
  const firstImportMatch = code.match(/^import /m);
  if (firstImportMatch) {
    const insertIndex = firstImportMatch.index;
    code = code.slice(0, insertIndex) + importStmt + code.slice(insertIndex);
  }
}

fs.writeFileSync('App.tsx', code);
console.log('App.tsx extracted correctly.');
