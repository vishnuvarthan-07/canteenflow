const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Fix Shell
code = code.replace(
  'function Shell({ children, cartCount, unreadCount, canteenStatus }: { children: ReactNode; cartCount: number; unreadCount: number; canteenStatus?: "OPEN" | "CLOSED" }) {',
  'function Shell({ children, cartCount, unreadCount, canteenStatus, settings }: { children: ReactNode; cartCount: number; unreadCount: number; canteenStatus?: "OPEN" | "CLOSED"; settings?: any }) {'
);

// 2. Fix AdminPage
code = code.replace(
  'function AdminPage({ canteenStatus }: { canteenStatus?: "OPEN" | "CLOSED" }) {',
  'function AdminPage({ canteenStatus, setSettings }: { canteenStatus?: "OPEN" | "CLOSED"; setSettings?: any }) {'
);

// 3. Fix Router types
code = code.replace(
  'function Router({ profile, foods, cart, eventCart, notices, setNotices, canteenStatus }: { profile: any; foods: Food[]; cart: ReturnType<typeof useCart>; eventCart: ReturnType<typeof useEventCart>; notices: Notice[]; setNotices: React.Dispatch<React.SetStateAction<Notice[]>>; canteenStatus?: "OPEN" | "CLOSED" }) {',
  'function Router({ profile, foods, cart, eventCart, notices, setNotices, canteenStatus, settings }: { profile: any; foods: Food[]; cart: ReturnType<typeof useCart>; eventCart: ReturnType<typeof useEventCart>; notices: Notice[]; setNotices: React.Dispatch<React.SetStateAction<Notice[]>>; canteenStatus?: "OPEN" | "CLOSED"; settings?: any }) {'
);

// 4. Add settings to HashRouter, WouterRouter
code = code.replace(
  'function HashRouter({ profile, foods, cart, eventCart, notices, setNotices, canteenStatus }: { profile: any; foods: Food[]; cart: ReturnType<typeof useCart>; eventCart: ReturnType<typeof useEventCart>; notices: Notice[]; setNotices: React.Dispatch<React.SetStateAction<Notice[]>>; canteenStatus?: "OPEN" | "CLOSED" }) {',
  'function HashRouter({ profile, foods, cart, eventCart, notices, setNotices, canteenStatus, settings }: { profile: any; foods: Food[]; cart: ReturnType<typeof useCart>; eventCart: ReturnType<typeof useEventCart>; notices: Notice[]; setNotices: React.Dispatch<React.SetStateAction<Notice[]>>; canteenStatus?: "OPEN" | "CLOSED"; settings?: any }) {'
);

code = code.replace(
  'function WouterRouter({ profile, foods, cart, eventCart, notices, setNotices, canteenStatus }: { profile: any; foods: Food[]; cart: ReturnType<typeof useCart>; eventCart: ReturnType<typeof useEventCart>; notices: Notice[]; setNotices: React.Dispatch<React.SetStateAction<Notice[]>>; canteenStatus?: "OPEN" | "CLOSED" }) {',
  'function WouterRouter({ profile, foods, cart, eventCart, notices, setNotices, canteenStatus, settings }: { profile: any; foods: Food[]; cart: ReturnType<typeof useCart>; eventCart: ReturnType<typeof useEventCart>; notices: Notice[]; setNotices: React.Dispatch<React.SetStateAction<Notice[]>>; canteenStatus?: "OPEN" | "CLOSED"; settings?: any }) {'
);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed signatures!');
