import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { getSanitizedSupabaseConfig } from "./client";

/**
 * Creates a Supabase client for Server Components, Server Actions, and Route Handlers
 * Uses @supabase/ssr official createServerClient with cookie handling
 */
export function createClient(cookieStore?: {
  getAll: () => Array<{ name: string; value: string }>;
  set: (name: string, value: string, options: CookieOptions) => void;
}) {
  const { url, key } = getSanitizedSupabaseConfig();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore ? cookieStore.getAll() : [];
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore?.set(name, value, options);
          });
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
    },
  });
}
