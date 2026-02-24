import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try to load .env if it exists (local dev), but Render will provide them in process.env
dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
// Support both common names for the key
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl) {
    throw new Error("SUPABASE_URL is missing! Please set it in your environment variables/dashboard.");
}
if (!supabaseKey) {
    throw new Error("SUPABASE_KEY (or SUPABASE_ANON_KEY) is missing! Please set it in your environment variables/dashboard.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
