const fs = require('fs');
let content = fs.readFileSync('App.tsx', 'utf-8');

// 1. Add Phone to lucide-react import
if (!content.includes(' Phone,')) {
  const lucideImportMatch = content.match(/import \{([^}]+)\} from ["']lucide-react["'];/);
  if (lucideImportMatch && !lucideImportMatch[1].includes('Phone')) {
    content = content.replace(lucideImportMatch[0], lucideImportMatch[0].replace('import {', 'import { Phone,'));
  }
}

// 2. Add Contact to links array in Shell
const linksRegex = /const links = \[\{ href: "\/", label: "Home", icon: HomeIcon \}, \{ href: "\/menu", label: "Menu", icon: Soup \}, \{ href: "\/events", label: "Events", icon: PartyPopper \}, \{ href: "\/orders", label: "Orders", icon: ReceiptText \}, \{ href: "\/notifications", label: "Alerts", icon: Bell \}\];/;
if (linksRegex.test(content)) {
  content = content.replace(
    linksRegex,
    'const links = [{ href: "/", label: "Home", icon: HomeIcon }, { href: "/menu", label: "Menu", icon: Soup }, { href: "/events", label: "Events", icon: PartyPopper }, { href: "/orders", label: "Orders", icon: ReceiptText }, { href: "/notifications", label: "Alerts", icon: Bell }, { href: "/contact", label: "Contact", icon: Phone }];'
  );
}

// 3. Fix App.tsx settings initial fetch
const targetRegex = /supabase\.from\("canteen_settings"\)\.select\("canteen_status"\)\.eq\("id", 1\)\.single\(\)\.then\(\(\{ data \}\) => \{[\s\n]*if \(data\) setCanteenStatus\(data\.canteen_status as "OPEN" \| "CLOSED"\);[\s\n]*\}\);/m;
const rep = `supabase.from("canteen_settings").select("*").eq("id", 1).maybeSingle().then(({ data }) => {
      if (data) {
        setCanteenStatus(data.canteen_status as "OPEN" | "CLOSED");
        setSettings(data as DbCanteenSettings);
      } else {
        setSettings({} as DbCanteenSettings);
      }
    });`;
if (targetRegex.test(content)) {
  content = content.replace(targetRegex, rep);
}

// 4. Add Settings button to AdminShell
const reqBtn = `<button onClick={() => setActiveTab("requests")} className={\`w-full whitespace-nowrap rounded-xl px-4 py-2.5 text-left font-bold \${activeTab === "requests" ? "bg-white text-[#ea6b42] shadow-sm" : "text-[#7b614b] hover:bg-[#e4d7c6]"}\`}>
            Registration Requests
          </button>`;
const settingsBtn = `<button onClick={() => setActiveTab("settings")} className={\`w-full whitespace-nowrap rounded-xl px-4 py-2.5 text-left font-bold \${activeTab === "settings" ? "bg-white text-[#ea6b42] shadow-sm" : "text-[#7b614b] hover:bg-[#e4d7c6]"}\`}>
            Settings
          </button>`;
if (content.includes(reqBtn) && !content.includes('setActiveTab("settings")')) {
  content = content.replace(reqBtn, reqBtn + '\n          ' + settingsBtn);
}

fs.writeFileSync('App.tsx', content);
console.log('Restored all fixes and added Admin Settings tab');
