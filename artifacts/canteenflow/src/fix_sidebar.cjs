const fs = require('fs');
let content = fs.readFileSync('App.tsx', 'utf-8');

// 1. Add Phone to lucide-react import
if (!content.includes(' Phone,')) {
  content = content.replace('import {', 'import { Phone,');
}

// 2. Add Contact to links array in Shell
const linksRegex = /const links = \[\{ href: "\/", label: "Home", icon: HomeIcon \}, \{ href: "\/menu", label: "Menu", icon: Soup \}, \{ href: "\/events", label: "Events", icon: PartyPopper \}, \{ href: "\/orders", label: "Orders", icon: ReceiptText \}, \{ href: "\/notifications", label: "Alerts", icon: Bell \}\];/;
if (linksRegex.test(content)) {
  content = content.replace(
    linksRegex,
    'const links = [{ href: "/", label: "Home", icon: HomeIcon }, { href: "/menu", label: "Menu", icon: Soup }, { href: "/events", label: "Events", icon: PartyPopper }, { href: "/orders", label: "Orders", icon: ReceiptText }, { href: "/notifications", label: "Alerts", icon: Bell }, { href: "/contact", label: "Contact", icon: Phone }];'
  );
  console.log('Added Contact to sidebar links.');
} else {
  console.log('Could not find links array to modify.');
}

fs.writeFileSync('App.tsx', content);
