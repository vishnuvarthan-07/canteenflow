import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envPath = join(__dirname, '.env');
const env = fs.readFileSync(envPath, 'utf8');

const parseEnv = (content) => {
    return content.split('\n').reduce((acc, line) => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            acc[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
        }
        return acc;
    }, {});
};

const envVars = parseEnv(env);

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_SERVICE_ROLE_KEY || envVars.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('canteen_settings').select('*').eq('id', 1).maybeSingle();
  console.log('Query:', data, error);
  if (!data && !error) {
    console.log('Inserting row 1');
    const res = await supabase.from('canteen_settings').insert([{ id: 1, canteen_status: 'OPEN' }]);
    console.log('Insert:', res);
  }
}
check();
