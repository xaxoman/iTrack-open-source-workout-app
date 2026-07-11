import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase is optional. The app works fully offline using the local JSON
 * (localStorage) store. Cloud sync is only available when the deployment
 * provides the following environment variables at build time:
 *
 *   VITE_SUPABASE_URL       - your project URL      (https://xxxx.supabase.co)
 *   VITE_SUPABASE_ANON_KEY  - your project anon key
 *
 * See .env.example and supabase/schema.sql for setup instructions.
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

/** Table that stores one JSON blob of the whole app state per user. */
export const USER_DATA_TABLE = 'user_data';
