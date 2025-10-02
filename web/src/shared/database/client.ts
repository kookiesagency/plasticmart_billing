import { createClient, SupabaseClient } from '@supabase/supabase-js'

// This will be overridden by platform-specific implementations
let supabaseClient: SupabaseClient | null = null

export const initializeSupabase = (url: string, anonKey: string): SupabaseClient => {
  supabaseClient = createClient(url, anonKey)
  return supabaseClient
}

export const getSupabaseClient = (): SupabaseClient => {
  if (!supabaseClient) {
    throw new Error('Supabase client not initialized. Call initializeSupabase first.')
  }
  return supabaseClient
}

// For backward compatibility and direct usage
export const createSupabaseClient = (url: string, anonKey: string): SupabaseClient => {
  return createClient(url, anonKey)
}