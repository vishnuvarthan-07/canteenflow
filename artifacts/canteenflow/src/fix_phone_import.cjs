const fs = require('fs');
let content = fs.readFileSync('App.tsx', 'utf-8');

// 1. Remove Phone from ContactPage import if it was added there accidentally
content = content.replace('import { Phone, ContactPage } from "./ContactPage";', 'import { ContactPage } from "./ContactPage";');

// 2. Add Phone to lucide-react import
const lucideImportMatch = content.match(/import \{([^}]+)\} from ["']lucide-react["'];/);
if (lucideImportMatch) {
  if (!lucideImportMatch[1].includes('Phone')) {
    content = content.replace(lucideImportMatch[0], lucideImportMatch[0].replace('import {', 'import { Phone,'));
  }
}

fs.writeFileSync('App.tsx', content);
