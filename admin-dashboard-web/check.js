const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
    const { data, error } = await supabase.from('attendance').select('*').limit(1);
    console.log('ERROR:', error);
    console.log('DATA:', data);
}
run();
