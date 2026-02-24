"use client";

import { useRecovery } from "@/lib/hooks/useRecovery";
import { useRecoveryHistory } from "@/lib/hooks/useRecoveryHistory";
import { RecoveryTrendChart } from "@/components/recovery/RecoveryTrendChart";
import { SleepDebtChart } from "@/components/recovery/SleepDebtChart";
import type { RecoveryEngineOutput } from "@/types/recovery";

const RECOMMENDATION_LABEL: Record<string, string> = {
  train: "Train",
  moderate: "Moderate",
  rest: "Rest",
};

function recoveryColor(score: number): string {
  if (score >= 85) return "text-restsmart-green";
  if (score >= 60) return "text-restsmart-yellow";
  return "text-restsmart-red";
}

function barColor(score: number): string {
  if (score >= 85) return "bg-restsmart-green";
  if (score >= 60) return "bg-restsmart-yellow";
  return "bg-restsmart-red";
}

export default function DashboardPage() {
  const { data, loading, error, refetch } = useRecovery({ save: true });

  if (loading) {
    return (
      <main className="min-h-screen bg-restsmart-bg p-6 font-sans md:p-8">
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="h-8 w-48 animate-pulse rounded bg-restsmart-card" />
          <div className="flex justify-center py-12">
            <div className="h-48 w-48 animate-pulse rounded-full bg-restsmart-card" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-lg bg-restsmart-card" />
            ))}
          </div>
          <div className="h-32 animate-pulse rounded-lg bg-restsmart-card" />
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-restsmart-bg p-6 font-sans md:p-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-slate-400">Recovery data unavailable. Try refreshing.</p>
          <button
            type="button"
            onClick={refetch}
            className="mt-4 rounded-lg bg-restsmart-card px-4 py-2 text-slate-200 hover:bg-slate-600"
          >
            Refresh
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-restsmart-bg p-6 font-sans md:p-8">
      <div className="mx-auto max-w-2xl space-y-8">
        <h1 className="text-xl font-medium text-slate-300">Recovery</h1>

        <RecoveryGauge data={data} />
        <MuscleBreakdown muscleBreakdown={data.muscleBreakdown} />
        <CnsCard cnsScore={data.cnsScore} projectedFullRecovery={data.projectedFullRecovery} />
        <SleepSection sleepScore={data.sleepScore} sleepDebt={data.sleepDebt} stressScore={data.stressScore} />
        <SafetyFlags overtrainingFlag={data.overtrainingFlag} deloadFlag={data.deloadFlag} />
        <RecoveryTrendSection />
        <SleepDebtTrendSection />
        <HabitsSection data={data} />
      </div>
    </main>
  );
}

function RecoveryGauge({ data }: { data: RecoveryEngineOutput }) {
  const score = Math.max(0, Math.min(100, data.overallScore));
  const label = RECOMMENDATION_LABEL[data.recommendation] ?? data.recommendation;
  const colorClass = recoveryColor(score);
  const circumference = 2 * Math.PI * 54;
  const strokeDash = (score / 100) * circumference;

  return (
    <section className="rounded-lg bg-restsmart-card p-6">
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <div className="relative h-40 w-40 shrink-0">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="#334155"
              strokeWidth="10"
            />
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - strokeDash}
              className={colorClass}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-semibold ${colorClass}`}>{score}</span>
            <span className="text-sm text-slate-500">/100</span>
          </div>
        </div>
        <div className="flex-1 text-center sm:text-left">
          <p className="text-lg font-medium text-slate-200">
            {label}
          </p>
          <p className="mt-2 text-slate-400">
            Your body is {score}% recovered. {label.toLowerCase()} training is recommended today.
          </p>
        </div>
      </div>
    </section>
  );
}

function MuscleBreakdown({ muscleBreakdown }: { muscleBreakdown: Record<string, number> }) {
  const entries = Object.entries(muscleBreakdown).filter(([, v]) => Number.isFinite(v));
  const sorted = [...entries].sort((a, b) => a[1] - b[1]);
  const labels: Record<string, string> = {
    chest: "Chest",
    back: "Back",
    shoulders: "Shoulders",
    arms: "Arms",
    quads: "Quads",
    hamstrings: "Hamstrings",
    glutes: "Glutes",
    calves: "Calves",
    core: "Core",
  };

  return (
    <section className="rounded-lg bg-restsmart-card p-6">
      <h2 className="text-lg font-medium text-slate-300">Muscle breakdown</h2>
      <div className="mt-4 space-y-3">
        {sorted.length === 0 ? (
          <p className="text-sm text-slate-500">No muscle group data.</p>
        ) : (
          sorted.map(([group, value]) => {
            const score = Math.max(0, Math.min(100, value));
            return (
              <div key={group} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-sm capitalize text-slate-400">
                  {labels[group] ?? group}
                </span>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-700">
                  <div
                    className={`h-full rounded-full ${barColor(score)}`}
                    style={{ width: `${score}%` }}
                  />
                </div>
                <span className="w-8 shrink-0 text-right text-sm text-slate-300">{score}</span>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

function CnsCard({
  cnsScore,
  projectedFullRecovery,
}: {
  cnsScore: number;
  projectedFullRecovery: string | null;
}) {
  const score = Math.max(0, Math.min(100, cnsScore));
  let dateText: string | null = null;
  if (projectedFullRecovery) {
    try {
      const d = new Date(projectedFullRecovery);
      if (!Number.isNaN(d.getTime())) {
        dateText = d.toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
      }
    } catch {
      // ignore
    }
  }

  return (
    <section className="rounded-lg bg-restsmart-card p-6">
      <h2 className="text-lg font-medium text-slate-300">CNS score</h2>
      <p className="mt-2 text-2xl font-semibold text-slate-100">{score}<span className="text-slate-500">/100</span></p>
      {dateText && (
        <p className="mt-2 text-sm text-slate-400">
          Full CNS recovery expected by: {dateText}
        </p>
      )}
    </section>
  );
}

function SleepSection({
  sleepScore,
  sleepDebt,
  stressScore,
}: {
  sleepScore: number;
  sleepDebt: number;
  stressScore: number;
}) {
  const score = Math.max(0, Math.min(100, sleepScore));
  const debtHours = Math.max(0, sleepDebt) / 60;
  const stress = Math.max(0, Math.min(100, stressScore));

  return (
    <section className="rounded-lg bg-restsmart-card p-6">
      <h2 className="text-lg font-medium text-slate-300">Sleep</h2>
      <p className="mt-2 text-2xl font-semibold text-slate-100">{score}<span className="text-slate-500">/100</span></p>
      <p className="mt-2 text-sm text-slate-400">
        {debtHours > 0
          ? `You are carrying ${debtHours.toFixed(1)} hours of sleep debt.`
          : "No significant sleep debt."}
      </p>
      <p className="mt-3 text-sm text-slate-400">Stress score: {stress}/100</p>
    </section>
  );
}

function streakBadgeClass(streak: number): string {
  if (streak >= 7) return "border-restsmart-green/40 bg-restsmart-green/10 text-slate-200";
  if (streak >= 3) return "border-slate-500/40 bg-slate-700/30 text-slate-300";
  return "border-slate-600/30 bg-slate-800/20 text-slate-500";
}

function HabitsSection({ data }: { data: RecoveryEngineOutput }) {
  const b = data.behavior ?? {
    recoveryCompliant: false,
    sleepTargetMet: false,
    balancedTraining: false,
  };
  const s = data.streaks ?? {
    recoveryStreak: 0,
    sleepStreak: 0,
    balanceStreak: 0,
  };
  return (
    <section className="rounded-lg bg-restsmart-card p-6">
      <h2 className="text-lg font-medium text-slate-300">Habits</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div
          className={`rounded-lg border p-4 ${
            b.recoveryCompliant
              ? "border-restsmart-green/40 bg-restsmart-green/10"
              : "border-restsmart-yellow/40 bg-restsmart-yellow/10"
          }`}
        >
          <p className="text-sm font-medium text-slate-200">Recovery Discipline</p>
          <p className="mt-1 text-sm text-slate-400">
            {b.recoveryCompliant ? "Aligned with recovery guidance" : "Training misaligned with recovery"}
          </p>
        </div>
        <div
          className={`rounded-lg border p-4 ${
            b.sleepTargetMet
              ? "border-restsmart-green/40 bg-restsmart-green/10"
              : "border-restsmart-yellow/40 bg-restsmart-yellow/10"
          }`}
        >
          <p className="text-sm font-medium text-slate-200">Sleep Discipline</p>
          <p className="mt-1 text-sm text-slate-400">
            {b.sleepTargetMet ? "Sleep target met" : "Sleep debt accumulating"}
          </p>
        </div>
        <div
          className={`rounded-lg border p-4 ${
            b.balancedTraining
              ? "border-restsmart-green/40 bg-restsmart-green/10"
              : "border-restsmart-yellow/40 bg-restsmart-yellow/10"
          }`}
        >
          <p className="text-sm font-medium text-slate-200">Training Balance</p>
          <p className="mt-1 text-sm text-slate-400">
            {b.balancedTraining ? "Balanced training pattern" : "Training load imbalance"}
          </p>
        </div>
      </div>
      <h3 className="mt-6 text-base font-medium text-slate-400">Consistency</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div className={`rounded-lg border p-3 ${streakBadgeClass(s.recoveryStreak)}`}>
          <p className="text-sm font-medium">
            {s.recoveryStreak} day recovery alignment
          </p>
        </div>
        <div className={`rounded-lg border p-3 ${streakBadgeClass(s.sleepStreak)}`}>
          <p className="text-sm font-medium">
            {s.sleepStreak} day sleep discipline
          </p>
        </div>
        <div className={`rounded-lg border p-3 ${streakBadgeClass(s.balanceStreak)}`}>
          <p className="text-sm font-medium">
            {s.balanceStreak} day balanced load
          </p>
        </div>
      </div>
      <DeloadSection data={data} />
    </section>
  );
}

function DeloadSection({ data }: { data: RecoveryEngineOutput }) {
  const d = data.deload ?? {
    active: false,
    recommended: false,
    suggestedReductionPercent: null,
  };
  const pct =
    d.suggestedReductionPercent != null ? `${d.suggestedReductionPercent}%` : null;

  return (
    <>
      <h3 className="mt-6 text-base font-medium text-slate-400">Deload Status</h3>
      {d.active ? (
        <div className="mt-3 rounded-lg border border-restsmart-green/30 bg-slate-700/20 p-4">
          <p className="text-sm font-medium text-slate-200">Deload cycle active</p>
          <p className="mt-1 text-sm text-slate-400">
            Suggested volume reduction: {pct ?? "—"}
          </p>
        </div>
      ) : d.recommended ? (
        <div className="mt-3 rounded-lg border border-restsmart-yellow/40 bg-restsmart-yellow/10 p-4">
          <p className="text-sm font-medium text-slate-200">Deload recommended</p>
          <p className="mt-1 text-sm text-slate-400">
            {d.suggestedReductionPercent != null
              ? `Accumulated fatigue trend detected. Suggested reduction: ${d.suggestedReductionPercent}%`
              : "Accumulated fatigue trend detected"}
          </p>
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-500">No deload cycle needed</p>
      )}
    </>
  );
}

function RecoveryTrendSection() {
  const { points, loading } = useRecoveryHistory("7d");

  return (
    <section className="rounded-lg bg-restsmart-card p-6">
      <h2 className="text-lg font-medium text-slate-300">Recovery Trend (7 Days)</h2>
      {loading ? (
        <div className="mt-4 h-48 animate-pulse rounded bg-slate-700/50" />
      ) : points.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">No recovery history yet.</p>
      ) : (
        <div className="mt-4">
          <RecoveryTrendChart points={points} />
        </div>
      )}
    </section>
  );
}

function SleepDebtTrendSection() {
  const { points, loading } = useRecoveryHistory("7d");

  return (
    <section className="rounded-lg bg-restsmart-card p-6">
      <h2 className="text-lg font-medium text-slate-300">Sleep Debt (7 Days)</h2>
      {loading ? (
        <div className="mt-4 h-48 animate-pulse rounded bg-slate-700/50" />
      ) : points.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">No sleep debt history yet.</p>
      ) : (
        <div className="mt-4">
          <SleepDebtChart points={points} />
        </div>
      )}
    </section>
  );
}

function SafetyFlags({
  overtrainingFlag,
  deloadFlag,
}: {
  overtrainingFlag: boolean;
  deloadFlag: boolean;
}) {
  if (!overtrainingFlag && !deloadFlag) return null;

  return (
    <section className="space-y-3">
      {overtrainingFlag && (
        <div className="rounded-lg border border-restsmart-red/40 bg-restsmart-red/10 p-4">
          <p className="text-sm text-slate-200">
            Recovery trend indicates possible overtraining risk.
          </p>
        </div>
      )}
      {deloadFlag && (
        <div className="rounded-lg border border-restsmart-yellow/40 bg-restsmart-yellow/10 p-4">
          <p className="text-sm text-slate-200">
            A deload period may be beneficial.
          </p>
        </div>
      )}
    </section>
  );
}
