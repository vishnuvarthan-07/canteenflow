const fs = require('fs');
let content = fs.readFileSync('App.tsx', 'utf-8');
content = content.replace('</main>">', '</main>');
fs.writeFileSync('App.tsx', content);
