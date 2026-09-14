import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/validation/env";

let client: SupabaseClient | undefined;

export function getSupabaseServerClient() {
  if (!client) {
    const env = getServerEnv();
    client = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return client;
}
