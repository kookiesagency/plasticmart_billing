import { SupabaseClient } from '@supabase/supabase-js';
export declare const initializeSupabase: (url: string, anonKey: string) => SupabaseClient;
export declare const getSupabaseClient: () => SupabaseClient;
export declare const createSupabaseClient: (url: string, anonKey: string) => SupabaseClient;
