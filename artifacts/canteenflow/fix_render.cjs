const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf-8');

const searchString = '<AdminRegistrationRequests />\n        </section>\n      )}';
const searchStringWin = '<AdminRegistrationRequests />\r\n        </section>\r\n      )}';

const insertBlock = `
      {activeTab === "contact" && (
        <section className="animate-rise space-y-6">
          <div className="rounded-2xl border border-[#e3d7c5] bg-[#fffaf0] p-5">
            <h2 className="font-display text-2xl mb-4">Contact & Hero Settings</h2>
            <AdminSettings currentSettings={settings} onSaved={setSettings} />
          </div>
        </section>
      )}`;

if (app.includes(searchString)) {
  app = app.replace(searchString, searchString + insertBlock);
  fs.writeFileSync('src/App.tsx', app);
  console.log('Fixed LF');
} else if (app.includes(searchStringWin)) {
  app = app.replace(searchStringWin, searchStringWin + insertBlock);
  fs.writeFileSync('src/App.tsx', app);
  console.log('Fixed CRLF');
} else {
  console.log('Could not find AdminRegistrationRequests block');
}
