const fs = require('fs');
let code = fs.readFileSync('src/regenerate_app.cjs', 'utf-8');
code = code.replace("fs.readFileSync('src/App.orig.tsx', 'utf-8')", "fs.readFileSync('src/App.tsx', 'utf-8')");
fs.writeFileSync('src/regenerate_app.cjs', code);
