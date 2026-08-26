const fs = require('fs');
const app = fs.readFileSync('src/App.tsx', 'utf-8');
const renderStart = app.indexOf('activeTab === "contact"');
if (renderStart !== -1) {
  console.log(app.substring(renderStart, renderStart + 500));
} else {
  console.log('activeTab === "contact" NOT FOUND!');
}
