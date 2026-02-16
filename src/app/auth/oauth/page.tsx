"use client";

/**
 * OAuth sign-in page (Google/Apple placeholders)
 * Configure providers in Supabase Dashboard: Auth > Providers
 */
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function OAuthPage() {
  const supabase = createClient();

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  async function signInWithApple() {
    await supabase.auth.signInWithOAuth({
      provider: "apple",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-2xl font-semibold text-slate-200">
          Sign in with OAuth
        </h1>
        <p className="text-sm text-slate-500">
          Enable providers in Supabase Dashboard → Auth → Providers
        </p>
        <div className="space-y-3">
          <button
            onClick={signInWithGoogle}
            className="w-full rounded border border-slate-600 px-4 py-2 text-slate-300 hover:border-slate-500"
          >
            Continue with Google
          </button>
          <button
            onClick={signInWithApple}
            className="w-full rounded border border-slate-600 px-4 py-2 text-slate-300 hover:border-slate-500"
          >
            Continue with Apple
          </button>
        </div>
        <p className="text-center text-sm text-slate-500">
          <Link href="/auth/login" className="hover:text-slate-400">
            Back to email sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
