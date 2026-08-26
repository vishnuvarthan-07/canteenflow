const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Add nav button
const navInsertPoint = app.indexOf('<div className="pt-4 mt-4 border-t border-white/10 space-y-1.5">');
const navButton = `        <button onClick={() => setActiveTab("contact")} className={\`w-full whitespace-nowrap rounded-xl px-4 py-2.5 text-left font-bold \${activeTab === "contact" ? "bg-white text-[#ea6b42] shadow-sm" : "text-[#7b614b] hover:bg-[#e4d7c6]"}\`}>
          Contact & Hero
        </button>\n`;

if (navInsertPoint !== -1 && !app.includes('setActiveTab("contact")')) {
  app = app.substring(0, navInsertPoint) + navButton + app.substring(navInsertPoint);
}

// 2. Add rendering block
const renderInsertPoint = app.indexOf('</AdminShell>', app.indexOf('activeTab === "requests"'));
const renderBlock = `\n      {activeTab === "contact" && (
        <section className="animate-rise">
          <AdminSettings currentSettings={settings} onSaved={setSettings} />
        </section>
      )}\n    `;

if (renderInsertPoint !== -1 && !app.includes('activeTab === "contact"')) {
  app = app.substring(0, renderInsertPoint) + renderBlock + app.substring(renderInsertPoint);
}

// 3. Make sure AdminSettings is imported (it might be but let's be sure)
if (!app.includes('import { AdminSettings }')) {
  app = 'import { AdminSettings } from "./AdminSettings";\n' + app;
}

fs.writeFileSync('src/App.tsx', app);
console.log("Successfully added Contact & Hero tab to AdminDesk");
