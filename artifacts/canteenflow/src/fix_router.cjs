const fs = require('fs');

let content = fs.readFileSync('App.tsx', 'utf-8');

const targetStr = 'function Router({ profile, foods, cart, eventCart, notices, setNotices, canteenStatus }: { profile: any; foods: Food[]; cart: ReturnType<typeof useCart>; eventCart: ReturnType<typeof useEventCart>; notices: Notice[]; setNotices: React.Dispatch<React.SetStateAction<Notice[]>>; canteenStatus?: "OPEN" | "CLOSED" }) {';
const replacementStr = 'function Router({ profile, foods, cart, eventCart, notices, setNotices, canteenStatus, settings }: { profile: any; foods: Food[]; cart: ReturnType<typeof useCart>; eventCart: ReturnType<typeof useEventCart>; notices: Notice[]; setNotices: React.Dispatch<React.SetStateAction<Notice[]>>; canteenStatus?: "OPEN" | "CLOSED"; settings?: DbCanteenSettings | null }) {';

content = content.replace(targetStr, replacementStr);

fs.writeFileSync('App.tsx', content);
console.log('Fixed router type');
