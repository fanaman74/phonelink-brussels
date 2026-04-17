import createIntlMiddleware from "next-intl/middleware";
import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { routing } from "./lib/routing";

const intlMiddleware = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
  // ── 1. Supabase session refresh ────────────────────────────────────────
  // Must run on every request so that the access token is always fresh.
  // Without this, auth.uid() returns null after ~1 hour → server actions fail.
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          // Write updated auth cookies into both the request and response
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
          );
        },
      },
    }
  );

  // Refresh session — this silently uses the refresh token if the access
  // token is expired, updating the cookies so subsequent server calls work.
  await supabase.auth.getUser();

  // ── 2. next-intl locale routing ────────────────────────────────────────
  const intlResponse = intlMiddleware(request);

  // Copy the refreshed Supabase auth cookies onto the intl response so
  // the locale redirect (if any) also carries the fresh session.
  response.cookies.getAll().forEach((cookie) => {
    intlResponse.cookies.set(cookie.name, cookie.value, cookie);
  });

  return intlResponse;
}

export const config = {
  matcher: [
    // Match all pathnames except:
    // - /api, /_next, /_vercel
    // - /videos (static video files in public/)
    // - files with a dot in the last segment (favicon.ico, images, etc.)
    "/((?!api|_next|_vercel|videos|[^/]*\\.[^/]*).*)",
  ],
};
