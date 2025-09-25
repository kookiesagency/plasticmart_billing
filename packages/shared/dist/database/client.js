import { createClient } from '@supabase/supabase-js';
// This will be overridden by platform-specific implementations
let supabaseClient = null;
export const initializeSupabase = (url, anonKey) => {
    supabaseClient = createClient(url, anonKey);
    return supabaseClient;
};
export const getSupabaseClient = () => {
    if (!supabaseClient) {
        throw new Error('Supabase client not initialized. Call initializeSupabase first.');
    }
    return supabaseClient;
};
// For backward compatibility and direct usage
export const createSupabaseClient = (url, anonKey) => {
    return createClient(url, anonKey);
};
