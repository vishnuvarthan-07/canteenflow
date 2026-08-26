const fs = require('fs');
let content = fs.readFileSync('App.tsx', 'utf-8');

content = content.replace(
  'function Shell({ children, cartCount, unreadCount, canteenStatus }: { children: ReactNode; cartCount: number; unreadCount: number; canteenStatus?: "OPEN" | "CLOSED" }) {',
  'function Shell({ children, cartCount, unreadCount, canteenStatus, settings }: { children: ReactNode; cartCount: number; unreadCount: number; canteenStatus?: "OPEN" | "CLOSED"; settings?: DbCanteenSettings | null }) {'
);

fs.writeFileSync('App.tsx', content);
console.log('Fixed shell type');
