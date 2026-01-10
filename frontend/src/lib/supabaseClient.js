
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase Environment Variables. Check your .env file.")
}

// Fallback to prevent crash during development if keys are missing
export const supabase = (supabaseUrl && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey)
    : {
        from: () => ({
            select: () => ({
                data: [],
                error: null,
                eq: () => ({ single: () => ({ data: null, error: null }) }) // Chainable eq, single for profile fetch
            })
        }),
        channel: () => ({ on: () => ({ subscribe: () => { } }) }),
        auth: {
            getSession: () => Promise.resolve({ data: { session: null }, error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
            signInWithPassword: () => Promise.resolve({ data: null, error: { message: "Auth not configured (missing keys)" } }),
            signUp: () => Promise.resolve({ data: null, error: { message: "Auth not configured (missing keys)" } }),
            signOut: () => Promise.resolve({ error: null })
        }
    };
