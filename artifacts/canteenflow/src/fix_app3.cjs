const fs = require('fs');
let content = fs.readFileSync('App.tsx', 'utf-8');
content = content.replace('</header><main className="pb-24 lg:ml-[236px] lg:pb-10">">', '</header><main className="pb-24 lg:ml-[236px] lg:pb-10">');
fs.writeFileSync('App.tsx', content);
