import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env["VITE_SUPABASE_URL"]?.trim();
const supabaseKey =
  import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"]?.trim() ||
  import.meta.env["VITE_SUPABASE_ANON_KEY"]?.trim();

/**
 * The browser client owns session persistence and token refresh. Keep it out of
 * the server render, where there is no per-user browser storage.
 */
export const supabase =
  typeof window !== "undefined" && supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: true,
          detectSessionInUrl: true,
          persistSession: true,
        },
      })
    : null;

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseKey);
