const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

content = content.replace('function useCart() {', 'export function useCart() {');
content = content.replace('const usePersisted =', 'export const usePersisted =');
content = content.replace('const readStore =', 'export const readStore =');
content = content.replace('function Empty(', 'export function Empty(');
content = content.replace('type DbPickupSlot =', 'export type DbPickupSlot =');
content = content.replace(/o\.orderDate/g, '(o as any).orderDate');

fs.writeFileSync('src/App.tsx', content);

let checkout = fs.readFileSync('src/CheckoutPage.tsx', 'utf-8');
const missingImports = "import { useCart, usePersisted, readStore, Empty, DbPickupSlot } from './App';\n";
if (!checkout.includes('useCart, usePersisted')) {
  checkout = checkout.replace('import { Food, money } from "./App";', missingImports + 'import { Food, money } from "./App";');
}
checkout = checkout.replace('export function FoodVisual({ item, className = "" }) {', 'export function FoodVisual({ item, className = "" }: { item: any, className?: string }) {');
fs.writeFileSync('src/CheckoutPage.tsx', checkout);
