const fs = require('fs');
const app = fs.readFileSync('src/App.tsx', 'utf-8');

// Find AdminShell nav buttons
const navStart = app.indexOf('<nav className="space-y-2 flex-1">');
const navEnd = app.indexOf('</nav>', navStart);
console.log('--- AdminShell Nav ---');
console.log(app.substring(navStart, navEnd));

// Find AdminPage tab rendering
const renderStart = app.indexOf('if (activeTab === "dashboard")');
const renderEnd = app.indexOf('</AdminShell>', renderStart);
console.log('--- AdminPage Rendering ---');
console.log(app.substring(renderStart, renderEnd));
