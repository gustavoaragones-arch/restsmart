"use client";

import { useEffect, useState } from "react";
import type { RecoveryScoreOutput } from "@/lib/recoveryEngine";

export default function DashboardPage() {
  const [recovery, setRecovery] = useState<RecoveryScoreOutput | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/recovery/calculate?save=true")
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setRecovery(data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen p-8">
        <p className="text-slate-400">Loading recovery...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-2xl font-semibold text-slate-200">Recovery Dashboard</h1>
      {recovery ? (
        <div className="mt-6 max-w-2xl space-y-6">
          <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-6">
            <h2 className="text-lg font-medium text-slate-300">Overall Score</h2>
            <p className="mt-1 text-4xl font-semibold text-slate-100">
              {recovery.overall_score}
              <span className="text-slate-400">/100</span>
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <ScoreCard label="Muscular" value={recovery.muscular_score} />
            <ScoreCard label="CNS" value={recovery.cns_score} />
            <ScoreCard label="Sleep" value={recovery.sleep_score} />
            <ScoreCard label="Stress" value={recovery.stress_score} />
          </div>
          <div className="rounded-lg border border-slate-700 p-4">
            <h3 className="font-medium text-slate-300">Recommendation</h3>
            <p className="mt-2 text-slate-200">{recovery.recommendation}</p>
          </div>
          {(recovery.overtraining_flag || recovery.deload_flag) && (
            <div className="flex gap-4">
              {recovery.overtraining_flag && (
                <span className="rounded bg-amber-900/50 px-3 py-1 text-amber-300">
                  Overtraining risk
                </span>
              )}
              {recovery.deload_flag && (
                <span className="rounded bg-orange-900/50 px-3 py-1 text-orange-300">
                  Deload recommended
                </span>
              )}
            </div>
          )}
        </div>
      ) : (
        <p className="mt-2 text-slate-400">Unable to load recovery data.</p>
      )}
    </main>
  );
}

function ScoreCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border border-slate-700 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-semibold text-slate-200">{value}/100</p>
    </div>
  );
}
