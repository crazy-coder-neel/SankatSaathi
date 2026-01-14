
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log("Initializing Supabase Client...");
console.log("URL:", supabaseUrl ? "Set" : "MISSING");
console.log("Key:", supabaseAnonKey ? "Set" : "MISSING " + (supabaseAnonKey ? "" : "(Check .env)"));

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("CRITICAL: Missing Supabase Environment Variables. Check your .env file.");
}

export const supabase = (supabaseUrl && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null; // Fail hard or handle null in consumers rather than a mock that hides errors
