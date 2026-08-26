const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf-8');

// Find start and end indices for CheckoutPage duplicate
const checkoutStart = code.indexOf('function CheckoutPage({ cart, canteenStatus }');
const ordersStart = code.indexOf('function OrdersPage(');

if (checkoutStart !== -1 && ordersStart !== -1 && checkoutStart < ordersStart) {
    code = code.slice(0, checkoutStart) + code.slice(ordersStart);
    fs.writeFileSync('App.tsx', code);
    console.log('Successfully removed duplicate CheckoutPage');
} else {
    console.log('Could not find the duplicate CheckoutPage or OrdersPage correctly');
}
