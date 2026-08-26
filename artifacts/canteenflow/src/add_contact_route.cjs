const fs = require('fs');
let content = fs.readFileSync('App.tsx', 'utf-8');

// 1. Add import
if (!content.includes('import { ContactPage }')) {
  const importStmt = 'import { ContactPage } from "./ContactPage";\n';
  const firstImportMatch = content.match(/^import /m);
  if (firstImportMatch) {
    const insertIndex = firstImportMatch.index;
    content = content.slice(0, insertIndex) + importStmt + content.slice(insertIndex);
  }
}

// 2. Add route
if (!content.includes('path="/contact"')) {
  content = content.replace(
    '<Route path="/profile">',
    '<Route path="/contact"><Shell cartCount={cart.count} unreadCount={notices.filter((n) => !n.is_read).length} canteenStatus={canteenStatus} settings={settings}><ContactPage settings={settings} /></Shell></Route>\n    <Route path="/profile">'
  );
}

fs.writeFileSync('App.tsx', content);
console.log('Added ContactPage route');
