const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
    console.log("Starting...");
    const { error } = await supabase.from('attendance').insert({
        student_id: '00000000-0000-0000-0000-000000000000',
        name: 'test',
        date: '2025-01-01',
        course_code: 'TEST',
        registration_number: '123',
        department: 'TEST',
        level: 'TEST',
        method: 'Passcode'
    });
    console.log("Error:", error);
    process.exit(0);
}
run();
