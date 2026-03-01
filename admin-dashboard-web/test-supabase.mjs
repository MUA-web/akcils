import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kenqaivrtbemmdmthxld.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlbnFhaXZydGJlbW1kbXRoeGxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NDQwNDYsImV4cCI6MjA4NzQyMDA0Nn0.unn0ok9C_tqc5t1VbreP7SIcwuC6HOnZn6qhYKF2txs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspect() {
    console.log('--- Inspecting public.students Data ---');
    try {
        const { data, error, count } = await supabase
            .from('students')
            .select('*', { count: 'exact' })
            .limit(5);

        if (error) {
            console.error('❌ Error fetching from students:', error.message);
        } else {
            console.log(`✅ Table exists. Found ${count} records.`);
            console.log('Data sample:', JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error('💥 Exception:', e.message);
    }
}

inspect();
