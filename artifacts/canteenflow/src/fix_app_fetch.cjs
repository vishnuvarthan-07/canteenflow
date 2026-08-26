const fs = require('fs');
let content = fs.readFileSync('App.tsx', 'utf-8');

const targetRegex = /supabase\.from\(\"canteen_settings\"\)\.select\(\"canteen_status\"\)\.eq\(\"id\", 1\)\.single\(\)\.then\(\(\{ data \}\) => \{[\s\n]*if \(data\) setCanteenStatus\(data\.canteen_status as \"OPEN\" \| \"CLOSED\"\);[\s\n]*\}\);/m;

const rep = `supabase.from("canteen_settings").select("*").eq("id", 1).maybeSingle().then(({ data }) => {
      if (data) {
        setCanteenStatus(data.canteen_status as "OPEN" | "CLOSED");
        setSettings(data as DbCanteenSettings);
      } else {
        setSettings({} as DbCanteenSettings);
      }
    });`;

if (targetRegex.test(content)) {
  content = content.replace(targetRegex, rep);
  fs.writeFileSync('App.tsx', content);
  console.log('Fixed App.tsx fetch');
} else {
  console.log('Target string not found');
}
