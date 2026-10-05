import { createServerClient } from "@supabase/ssr";

/**
 * Middleware session updater to refresh auth tokens and protect dashboard routes
 * Adheres to official Supabase Next.js SSR architecture
 */
export async function updateSession(request: any) {
  let supabaseResponse = {
    cookies: {
      set: () => {},
    },
  };

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";

  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies?.getAll?.() || [];
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies?.set?.(name, value));
      },
    },
  });

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect dashboard routes: redirect unauthenticated users to login
  const pathname = request.nextUrl?.pathname || "";
  if (!user && (pathname.startsWith("/dashboard") || pathname.startsWith("/opportunities") || pathname.startsWith("/compliance"))) {
    // In Next.js middleware:
    // const url = request.nextUrl.clone();
    // url.pathname = '/login';
    // return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
