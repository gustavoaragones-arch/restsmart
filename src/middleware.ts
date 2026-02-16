import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PREMIUM_PATHS = ["/dashboard", "/recovery"];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isPremiumPath = PREMIUM_PATHS.some((p) => pathname.startsWith(p));

  const supabaseResponse = await updateSession(request);

  if (isPremiumPath) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const { createServerClient } = await import("@supabase/ssr");

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {
          // Read-only check - cookies refreshed by updateSession
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("plan, status, grace_period_ends_at")
      .eq("user_id", user.id)
      .single();

    const hasPremium =
      sub &&
      ["monthly", "annual", "lifetime"].includes(sub.plan) &&
      (sub.status === "active" ||
        sub.status === "trialing" ||
        (sub.status === "past_due" &&
          sub.grace_period_ends_at &&
          new Date(sub.grace_period_ends_at) > new Date()));

    if (!hasPremium) {
      return NextResponse.redirect(new URL("/upgrade", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/stripe/webhook|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
