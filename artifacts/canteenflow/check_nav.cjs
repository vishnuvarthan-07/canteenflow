const fs = require('fs');
const app = fs.readFileSync('src/App.tsx', 'utf-8');
const navStart = app.indexOf('<nav className="space-y-2 flex-1">');
const navEnd = app.indexOf('</nav>', navStart);
console.log(app.substring(navStart, navEnd));
