import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

function getEnvValue(value?: string) {
  const trimmed = value?.trim() || "";
  if (!trimmed || trimmed.includes("!!!!!!!!!!!!!!!!")) {
    return "";
  }
  return trimmed;
}

export function getSupabaseBrowserClient() {
  if (browserClient) {
    return browserClient;
  }

  const supabaseUrl = getEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseAnonKey = getEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  browserClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });

  return browserClient;
}

export function getSupabaseStorageBucket() {
  return getEnvValue(process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET) || "property-assets";
}
