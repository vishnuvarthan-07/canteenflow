const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf-8');
let lines = content.split('\n');

// 1. Add imports if missing
if (!content.includes('import { ContactPage }')) {
    const lastImportIndex = lines.findLastIndex(l => l.startsWith('import '));
    lines.splice(lastImportIndex + 1, 0, 'import { ContactPage } from "./ContactPage";', 'import { AdminSettings } from "./AdminSettings";');
}
if (!content.includes('import { FileText')) {
    const lucideImportIndex = lines.findIndex(l => l.includes('from "lucide-react"'));
    if (lucideImportIndex > -1) {
        lines[lucideImportIndex] = lines[lucideImportIndex].replace('{', '{ FileText, Info,');
    }
}

// 2. Fix useCart export (if not exported)
const useCartIndex = lines.findIndex(l => l.startsWith('function useCart() {'));
if (useCartIndex > -1) lines[useCartIndex] = 'export function useCart() {';

const usePersistedIndex = lines.findIndex(l => l.startsWith('const usePersisted ='));
if (usePersistedIndex > -1) lines[usePersistedIndex] = 'export const usePersisted =';

const readStoreIndex = lines.findIndex(l => l.startsWith('const readStore ='));
if (readStoreIndex > -1) lines[readStoreIndex] = 'export const readStore =';

const emptyIndex = lines.findIndex(l => l.startsWith('function Empty('));
if (emptyIndex > -1) lines[emptyIndex] = 'export function Empty(';

const pickupSlotIndex = lines.findIndex(l => l.startsWith('type DbPickupSlot ='));
if (pickupSlotIndex > -1) lines[pickupSlotIndex] = 'export type DbPickupSlot =';

// 3. Fix App component
const appCompIndex = lines.findIndex(l => l.includes('function App() {'));
if (appCompIndex > -1) {
    const stateIndex = lines.findIndex((l, i) => i > appCompIndex && l.includes('const [canteenStatus'));
    if (stateIndex > -1 && !lines[stateIndex + 1].includes('const [settings')) {
        lines.splice(stateIndex + 1, 0, '  const [settings, setSettings] = useState<any>(null);');
    }
    
    // Fix fetch
    const fetchIndex = lines.findIndex((l, i) => i > appCompIndex && l.includes('supabase.from("canteen_settings").select("canteen_status")'));
    if (fetchIndex > -1) {
        lines[fetchIndex] = '    supabase.from("canteen_settings").select("*").eq("id", 1).maybeSingle().then(({ data }) => {';
        lines[fetchIndex + 1] = '      if (data) {';
        lines[fetchIndex + 2] = '        setCanteenStatus(data.canteen_status as "OPEN" | "CLOSED");';
        lines.splice(fetchIndex + 3, 0, '        setSettings(data);', '      }', '    });');
    }

    // Fix <Router call
    const routerCallIndex = lines.findIndex((l, i) => i > appCompIndex && l.includes('<Router profile={profile}'));
    if (routerCallIndex > -1) {
        lines[routerCallIndex] = lines[routerCallIndex].replace('<Router profile={profile}', '<Router settings={settings} setSettings={setSettings} profile={profile}');
    }
}

// 4. Fix Router component signature
const routerDeclIndex = lines.findIndex(l => l.includes('function Router('));
if (routerDeclIndex > -1 && !lines[routerDeclIndex].includes('settings?: any')) {
    lines[routerDeclIndex] = lines[routerDeclIndex].replace(
        'canteenStatus }: {',
        'canteenStatus, settings, setSettings }: {'
    ).replace(
        'canteenStatus?: "OPEN" | "CLOSED" }) {',
        'canteenStatus?: "OPEN" | "CLOSED"; settings?: any; setSettings?: any; }) {'
    );
}

// 5. Pass settings in Router
if (routerDeclIndex > -1) {
    for (let i = routerDeclIndex; i < lines.length; i++) {
        if (lines[i].includes('function App()')) break;
        
        if (lines[i].includes('<Home cart={cart} foods={foods} />')) {
            lines[i] = lines[i].replace('<Home cart={cart} foods={foods} />', '<Home cart={cart} foods={foods} settings={settings} />');
        }
        if (lines[i].includes('<AdminPage canteenStatus={canteenStatus} />')) {
            lines[i] = lines[i].replace('<AdminPage canteenStatus={canteenStatus} />', '<AdminPage canteenStatus={canteenStatus} settings={settings} setSettings={setSettings} />');
        }
        // inject to all Shell components
        if (lines[i].includes('<Shell cartCount={cart.count}') && !lines[i].includes('settings={settings}')) {
            lines[i] = lines[i].replace('canteenStatus={canteenStatus}>', 'canteenStatus={canteenStatus} settings={settings}>');
        }
    }
}

// 6. Fix AdminPage signature
const adminPageIdx = lines.findIndex(l => l.includes('function AdminPage('));
if (adminPageIdx > -1 && !lines[adminPageIdx].includes('settings?: any')) {
    lines[adminPageIdx] = lines[adminPageIdx].replace(
        'canteenStatus }: {',
        'canteenStatus, settings, setSettings }: {'
    ).replace(
        'canteenStatus?: "OPEN" | "CLOSED" }) {',
        'canteenStatus?: "OPEN" | "CLOSED"; settings?: any; setSettings?: any; }) {'
    );
}

// 7. Fix Shell signature
const shellIdx = lines.findIndex(l => l.includes('function Shell('));
if (shellIdx > -1 && !lines[shellIdx].includes('settings?: any')) {
    lines[shellIdx] = lines[shellIdx].replace(
        'canteenStatus }: {',
        'canteenStatus, settings }: {'
    ).replace(
        'canteenStatus?: "OPEN" | "CLOSED" }) {',
        'canteenStatus?: "OPEN" | "CLOSED"; settings?: any; }) {'
    );
}

fs.writeFileSync('src/App.tsx', lines.join('\n').replace(/o\.orderDate/g, '(o as any).orderDate'));

// 8. Fix CheckoutPage.tsx
let checkout = fs.readFileSync('src/CheckoutPage.tsx', 'utf-8');
const missingImports = "import { useCart, usePersisted, readStore, Empty, DbPickupSlot } from './App';\n";
if (!checkout.includes('useCart, usePersisted')) {
  checkout = checkout.replace('import { Food, money } from "./App";', missingImports + 'import { Food, money } from "./App";');
}
checkout = checkout.replace('export function FoodVisual({ item, className = "" }) {', 'export function FoodVisual({ item, className = "" }: { item: any, className?: string }) {');
fs.writeFileSync('src/CheckoutPage.tsx', checkout);

console.log('App patched.');
