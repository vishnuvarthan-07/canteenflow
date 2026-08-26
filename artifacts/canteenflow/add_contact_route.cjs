const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

if (!content.includes('<Route path="/contact">')) {
  content = content.replace(
    '<Route component={NotFound} />',
    '<Route path="/contact"><ContactPage settings={settings} /></Route>\n        <Route component={NotFound} />'
  );
  fs.writeFileSync('src/App.tsx', content);
  console.log('Added Contact route');
} else {
  console.log('Contact route already exists');
}
