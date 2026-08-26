const fs = require('fs');

let app = fs.readFileSync('src/App.tsx', 'utf-8');
app = app.replace('function useCart() {', 'export function useCart() {');
app = app.replace('const usePersisted =', 'export const usePersisted =');
app = app.replace('const readStore =', 'export const readStore =');
app = app.replace('function Empty(', 'export function Empty(');
app = app.replace('type DbPickupSlot =', 'export type DbPickupSlot =');
app = app.replace(/o\.orderDate/g, '(o as any).orderDate');
fs.writeFileSync('src/App.tsx', app);

let checkout = fs.readFileSync('src/CheckoutPage.tsx', 'utf-8');
checkout = checkout.replace('export function FoodVisual({ item, className = "" }) {', 'export function FoodVisual({ item, className = "" }: { item: any, className?: string }) {');
fs.writeFileSync('src/CheckoutPage.tsx', checkout);
console.log('Fixed');
