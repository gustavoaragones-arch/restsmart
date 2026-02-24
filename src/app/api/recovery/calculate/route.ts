/**
 * Calculate recovery (Phase 2 engine) and optionally save snapshot
 * Trigger: workout logged, sleep logged, dashboard opened
 */

import { createClient } from "@/lib/supabase/server";
import {
  fetchRecoveryInput,
  runRecoveryEngine,
  saveSnapshot,
} from "@/lib/recovery";
import { runBehaviorEngine } from "@/lib/behavior/behaviorEngine";
import { upsertBehavioralMetrics } from "@/lib/behavior/upsertBehavioralMetrics";
import { fetchBehaviorHistory } from "@/lib/behavior/fetchBehaviorHistory";
import { runStreakEngine } from "@/lib/behavior/streakEngine";
import { fetchDeloadInput } from "@/lib/periodization/fetchDeloadInput";
import { runPeriodizationEngine } from "@/lib/periodization/periodizationEngine";
import {
  hasActiveDeload,
  getActiveDeloadReduction,
  startDeloadCycle,
} from "@/lib/periodization/deloadCycles";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const supabase = await createClient();

  // DEV MODE: allow unauthenticated access temporarily
  let userId: string | null = null;

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    userId = user?.id ?? null;
  } catch {
    userId = null;
  }

  // If no user, use temporary dev user
  if (!userId) {
    userId = "00000000-0000-0000-0000-000000000000";
  }

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") ?? new Date().toISOString().slice(0, 10);
  const save = searchParams.get("save") === "true";

  try {
    const dateOnly = date.slice(0, 10);
    const input = await fetchRecoveryInput(userId, date);
    const output = runRecoveryEngine(input);

    const sevenDaysAgo = new Date(dateOnly);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().slice(0, 10);
    const workoutDatesLast7 = input.workouts
      .filter((w) => w.workout_date >= sevenDaysAgoStr && w.workout_date <= dateOnly)
      .map((w) => w.workout_date.slice(0, 10));
    const uniqueDates = Array.from(new Set(workoutDatesLast7));

    const behaviorInput = {
      recommendation: output.recommendation,
      workoutLoggedToday: input.workouts.some((w) => w.workout_date.slice(0, 10) === dateOnly),
      sleepDebtMinutes: output.sleepDebt ?? 0,
      last7DaysWorkoutDates: uniqueDates,
      overtrainingFlag: output.overtrainingFlag,
    };
    const behavior = runBehaviorEngine(behaviorInput);

    if (save) {
      const { createAdminClient } = await import("@/lib/supabase/admin");
      const admin = createAdminClient();
      const { data: existing } = await admin
        .from("recovery_snapshots")
        .select("id")
        .eq("user_id", userId)
        .eq("snapshot_date", dateOnly)
        .is("deleted_at", null)
        .maybeSingle();
      if (!existing) {
        await saveSnapshot(userId, dateOnly, output);
      }
      await upsertBehavioralMetrics(userId, dateOnly, behavior);
    }

    const behaviorHistory = await fetchBehaviorHistory(userId);
    const streaks = runStreakEngine(behaviorHistory, dateOnly);

    const deloadSnapshots = await fetchDeloadInput(userId, dateOnly);
    const activeDeload = await hasActiveDeload(userId);
    let deloadOutput = runPeriodizationEngine(deloadSnapshots, dateOnly);
    if (activeDeload) {
      deloadOutput = { deloadRecommended: false, reason: null, suggestedReductionPercent: null };
    }

    let activeReduction: number | null = null;
    let deloadActive = activeDeload;
    if (activeDeload) {
      activeReduction = await getActiveDeloadReduction(userId);
    } else if (
      save &&
      deloadOutput.deloadRecommended &&
      deloadOutput.reason != null &&
      deloadOutput.suggestedReductionPercent != null
    ) {
      await startDeloadCycle(
        userId,
        dateOnly,
        deloadOutput.reason,
        deloadOutput.suggestedReductionPercent
      );
      deloadActive = true;
      activeReduction = deloadOutput.suggestedReductionPercent;
    }

    return NextResponse.json({
      muscularScore: output.muscularScore,
      muscleBreakdown: output.muscleBreakdown ?? {},
      cnsScore: output.cnsScore,
      sleepScore: output.sleepScore,
      sleepDebt: output.sleepDebt ?? 0,
      stressScore: output.stressScore,
      overallScore: output.overallScore,
      recommendation: output.recommendation,
      projectedFullRecovery: output.projectedFullRecovery ?? null,
      overtrainingFlag: output.overtrainingFlag,
      deloadFlag: output.deloadFlag,
      generatedAt: output.generatedAt ?? new Date().toISOString(),
      muscular_score: output.muscularScore,
      cns_score: output.cnsScore,
      sleep_score: output.sleepScore,
      stress_score: output.stressScore,
      overall_score: output.overallScore,
      projected_full_recovery_timestamp: output.projectedFullRecovery,
      overtraining_flag: output.overtrainingFlag,
      deload_flag: output.deloadFlag,
      behavior: {
        recoveryCompliant: behavior.recoveryCompliant,
        sleepTargetMet: behavior.sleepTargetMet,
        balancedTraining: behavior.balancedTraining,
      },
      streaks: {
        recoveryStreak: streaks.recoveryStreak,
        sleepStreak: streaks.sleepStreak,
        balanceStreak: streaks.balanceStreak,
      },
      deload: {
        active: deloadActive,
        recommended: deloadOutput.deloadRecommended,
        suggestedReductionPercent:
          activeReduction != null ? activeReduction : deloadOutput.suggestedReductionPercent,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
