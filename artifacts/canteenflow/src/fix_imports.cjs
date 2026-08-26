const fs = require('fs');
let content = fs.readFileSync('App.tsx', 'utf-8');

const importStmt = 'import { CheckoutPage } from "./CheckoutPage";\n';
if (!content.includes('import { CheckoutPage }')) {
  const firstImportMatch = content.match(/^import /m);
  if (firstImportMatch) {
    const insertIndex = firstImportMatch.index;
    content = content.slice(0, insertIndex) + importStmt + content.slice(insertIndex);
  }
}

if (content.includes('function readStore(') && !content.includes('export function readStore(')) {
  content = content.replace('function readStore(', 'export function readStore(');
}

fs.writeFileSync('App.tsx', content);
console.log('Fixed imports and exports');
