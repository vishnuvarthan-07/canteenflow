const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf-8');

const targetStr = '    </AdminShell>\n  );\n}';
const insertStr = `
      {activeTab === "contact" && (
        <section className="animate-rise space-y-6">
          <div className="rounded-2xl border border-[#e3d7c5] bg-[#fffaf0] p-5">
            <h2 className="font-display text-2xl mb-4">Contact & Hero Settings</h2>
            <AdminSettings currentSettings={settings} onSaved={setSettings} />
          </div>
        </section>
      )}
    </AdminShell>
  );
}`;

if (app.includes(targetStr)) {
  app = app.replace(targetStr, insertStr);
  fs.writeFileSync('src/App.tsx', app);
  console.log("Successfully inserted AdminSettings block.");
} else {
  console.log("Target string not found in App.tsx!");
}
