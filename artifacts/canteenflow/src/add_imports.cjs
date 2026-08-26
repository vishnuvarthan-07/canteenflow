const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');
const imports = `import { CheckoutPage, SuccessPage } from "./CheckoutPage";\nimport { AdminSettings } from "./AdminSettings";\nimport { AdminPaymentSettings } from "./AdminPaymentSettings";\nimport { ContactPage } from "./ContactPage";\nimport { CanteenProfile } from "./CanteenProfile";\n`;

// If they are not already imported, add them at the top
if (!code.includes('import { CheckoutPage')) {
  code = imports + code;
  fs.writeFileSync('src/App.tsx', code);
  console.log('Added missing imports to App.tsx');
}
