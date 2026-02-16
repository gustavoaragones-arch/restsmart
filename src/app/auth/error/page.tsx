"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const message = searchParams.get("message") ?? "An error occurred";

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4 text-center">
        <h1 className="text-2xl font-semibold text-slate-200">
          Authentication error
        </h1>
        <p className="text-slate-400">{message}</p>
        <Link
          href="/auth/login"
          className="inline-block text-slate-400 hover:text-slate-300"
        >
          Try again
        </Link>
      </div>
    </main>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center p-4"><p className="text-slate-400">Loading...</p></main>}>
      <AuthErrorContent />
    </Suspense>
  );
}
