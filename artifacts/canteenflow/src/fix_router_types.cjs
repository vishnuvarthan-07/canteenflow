const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// Fix Shell
code = code.replace(
  /function Shell\(\{\s*children,\s*cartCount,\s*unreadCount,\s*canteenStatus\s*\}\s*:\s*\{\s*children:\s*ReactNode;\s*cartCount:\s*number;\s*unreadCount:\s*number;\s*canteenStatus\?:\s*"OPEN"\s*\|\s*"CLOSED";\s*\}\) \{/,
  'function Shell({ children, cartCount, unreadCount, canteenStatus, settings }: { children: ReactNode; cartCount: number; unreadCount: number; canteenStatus?: "OPEN" | "CLOSED"; settings?: any }) {'
);

// Fix HashRouter
code = code.replace(
  /function HashRouter\(\{\s*profile,\s*foods,\s*cart,\s*eventCart,\s*notices,\s*setNotices,\s*canteenStatus\s*\}\s*:\s*\{/,
  'function HashRouter({ profile, foods, cart, eventCart, notices, setNotices, canteenStatus, settings }: {'
);

// Fix WouterRouter
code = code.replace(
  /function WouterRouter\(\{\s*profile,\s*foods,\s*cart,\s*eventCart,\s*notices,\s*setNotices,\s*canteenStatus\s*\}\s*:\s*\{/,
  'function WouterRouter({ profile, foods, cart, eventCart, notices, setNotices, canteenStatus, settings }: {'
);

// Fix Router
code = code.replace(
  /function Router\(\{\s*profile,\s*foods,\s*cart,\s*eventCart,\s*notices,\s*setNotices,\s*canteenStatus\s*\}\s*:\s*\{/,
  'function Router({ profile, foods, cart, eventCart, notices, setNotices, canteenStatus, settings }: {'
);

// Add settings to Router props type (it's used 3 times)
code = code.replace(/canteenStatus\?:\s*"OPEN"\s*\|\s*"CLOSED";\s*\}\)/g, 'canteenStatus?: "OPEN" | "CLOSED"; settings?: any; })');

// Fix the call to AdminPage inside AdminShell
code = code.replace(/<AdminPage canteenStatus=\{canteenStatus\} \/>/, '<AdminPage canteenStatus={canteenStatus} setSettings={setSettings} />');

fs.writeFileSync('src/App.tsx', code);
console.log("Fixed missing types");
