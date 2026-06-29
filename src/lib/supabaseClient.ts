import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ??
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

let browserClient: SupabaseClient | null = null;

export const SUPABASE_AUTH_CALLBACK_PATH = '/auth/callback';

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabasePublishableKey);
}

export function getSupabaseBrowserClient() {
  if (!isSupabaseConfigured()) return null;
  if (browserClient) return browserClient;

  browserClient = createClient(supabaseUrl!, supabasePublishableKey!, {
    global: {
      headers: {
        apikey: supabasePublishableKey!,
      },
    },
    auth: {
      flowType: 'pkce',
      detectSessionInUrl: false,
      autoRefreshToken: true,
      persistSession: true,
    },
  });

  return browserClient;
}
