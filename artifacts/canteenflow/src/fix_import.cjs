const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf-8');
code = code.replace('import { CheckoutPage }\nimport { SuccessPage } from "./CheckoutPage";', 'import { CheckoutPage, SuccessPage } from "./CheckoutPage";');
fs.writeFileSync('App.tsx', code);
