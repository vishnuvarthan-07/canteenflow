const fs = require('fs');
const app = fs.readFileSync('src/App.tsx', 'utf-8');

const renderStart = app.indexOf('if (activeTab === "requests") {');
if (renderStart !== -1) {
  const renderEnd = app.indexOf('</AdminShell>', renderStart);
  console.log(app.substring(renderStart, renderEnd));
} else {
  // Try alternative format
  const altRenderStart = app.indexOf('activeTab === "requests"');
  const altRenderEnd = app.indexOf('</AdminShell>', altRenderStart);
  console.log(app.substring(altRenderStart, altRenderEnd));
}
