"use client";

import { useState } from "react";
import Link from "next/link";

export default function UpgradePage() {
  const [loading, setLoading] = useState<string | null>(null);

  async function handleCheckout(plan: "monthly" | "annual" | "lifetime") {
    setLoading(plan);
    const res = await fetch("/api/stripe/create-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const { url } = await res.json();
    if (url) window.location.href = url;
    setLoading(null);
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8">
        <h1 className="text-2xl font-semibold text-slate-200">
          Upgrade to Premium
        </h1>
        <p className="text-slate-400">
          Unlock recovery intelligence, trends, and premium features.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <PlanCard
            name="Monthly"
            price="$9/mo"
            onSelect={() => handleCheckout("monthly")}
            loading={loading === "monthly"}
          />
          <PlanCard
            name="Annual"
            price="$79/yr"
            description="Save 27%"
            onSelect={() => handleCheckout("annual")}
            loading={loading === "annual"}
            highlight
          />
          <PlanCard
            name="Lifetime"
            price="$199"
            description="One-time"
            onSelect={() => handleCheckout("lifetime")}
            loading={loading === "lifetime"}
          />
        </div>
        <p className="text-center text-sm text-slate-500">
          <Link href="/" className="hover:text-slate-400">
            Continue with free plan
          </Link>
        </p>
      </div>
    </main>
  );
}

function PlanCard({
  name,
  price,
  description,
  onSelect,
  loading,
  highlight,
}: {
  name: string;
  price: string;
  description?: string;
  onSelect: () => void;
  loading: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-6 ${
        highlight ? "border-slate-500 bg-slate-900/50" : "border-slate-700"
      }`}
    >
      <h2 className="font-medium text-slate-200">{name}</h2>
      <p className="mt-1 text-2xl text-slate-100">{price}</p>
      {description && (
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      )}
      <button
        onClick={onSelect}
        disabled={loading}
        className="mt-4 w-full rounded bg-slate-700 px-4 py-2 text-slate-200 hover:bg-slate-600 disabled:opacity-50"
      >
        {loading ? "Loading..." : "Subscribe"}
      </button>
    </div>
  );
}
