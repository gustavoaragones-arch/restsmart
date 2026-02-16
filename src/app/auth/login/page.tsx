"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"password" | "magic">("password");

  const supabase = createClient();

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    window.location.href = "/";
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setMagicLinkSent(true);
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-2xl font-semibold text-slate-200">Sign in</h1>

        {magicLinkSent ? (
          <p className="text-slate-400">
            Check your email for the magic link. You can close this tab.
          </p>
        ) : (
          <form
            onSubmit={mode === "password" ? handlePasswordLogin : handleMagicLink}
            className="space-y-4"
          >
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-400"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-200"
              />
            </div>

            {mode === "password" && (
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-400"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={mode === "password"}
                  className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-200"
                />
              </div>
            )}

            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="rounded bg-slate-700 px-4 py-2 text-slate-200 hover:bg-slate-600 disabled:opacity-50"
              >
                {loading ? "Loading..." : mode === "password" ? "Sign in" : "Send magic link"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "password" ? "magic" : "password");
                  setError(null);
                }}
                className="rounded border border-slate-600 px-4 py-2 text-slate-400 hover:border-slate-500"
              >
                {mode === "password" ? "Use magic link" : "Use password"}
              </button>
            </div>
          </form>
        )}

        <p className="text-center text-sm text-slate-500">
          <Link href="/auth/signup" className="hover:text-slate-400">
            Create account
          </Link>
        </p>
      </div>
    </main>
  );
}
