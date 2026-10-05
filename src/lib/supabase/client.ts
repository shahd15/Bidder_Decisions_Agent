import { createBrowserClient } from "@supabase/ssr";

/**
 * Robust Supabase credentials resolver that sanitizes URLs,
 * handles key-url swaps gracefully, and ensures valid HTTP/HTTPS formatting.
 */
export function getSanitizedSupabaseConfig() {
  const envUrl =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_URL) ||
    (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_SUPABASE_URL) ||
    "";

  const envKey =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
    (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
    "";

  let url = "";
  // Check if envUrl starts with http/https
  if (typeof envUrl === "string" && (envUrl.startsWith("http://") || envUrl.startsWith("https://"))) {
    url = envUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
  } else if (typeof envKey === "string" && (envKey.startsWith("http://") || envKey.startsWith("https://"))) {
    // In case URL was assigned to key variable
    url = envKey.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
  } else {
    url = "https://placeholder-project.supabase.co";
  }

  let key = "";
  if (typeof envKey === "string" && !envKey.startsWith("http://") && !envKey.startsWith("https://") && envKey.length > 5) {
    key = envKey;
  } else if (typeof envUrl === "string" && !envUrl.startsWith("http://") && !envUrl.startsWith("https://") && envUrl.length > 5) {
    // In case key was assigned to URL variable
    key = envUrl;
  } else {
    key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_anon_token";
  }

  const isLive = Boolean(
    url &&
    !url.includes("placeholder") &&
    (url.startsWith("http://") || url.startsWith("https://")) &&
    key &&
    !key.includes("dummy")
  );

  return { url, key, isLive };
}

/**
 * Creates a Supabase client for client-side components (browser context)
 * Uses @supabase/ssr official createBrowserClient
 */
export function createClient() {
  const { url, key } = getSanitizedSupabaseConfig();
  return createBrowserClient(url, key);
}

// Singleton instance for quick browser access
export const supabaseBrowserClient = createClient();
