import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Create Supabase client bound to middleware (Edge-safe)
  const supabase = createMiddlewareClient({ req, res });

  // Get current session (Edge-compatible)
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = req.nextUrl;

  // Protect dashboard routes
  if (pathname.startsWith("/dashboard")) {
    if (!session) {
      const loginUrl = new URL("/login", req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return res;
}

// Define which routes middleware runs on
export const config = {
  matcher: ["/dashboard/:path*"],
};