/**
 * Save recovery snapshot to recovery_snapshots
 * Never writes undefined; always uses server timestamp fallback for generatedAt
 */

import { createAdminClient } from "@/lib/supabase/admin";
import type { RecoveryEngineOutput } from "./recoveryEngine";

export async function saveSnapshot(
  userId: string,
  snapshotDate: string,
  output: RecoveryEngineOutput
): Promise<void> {
  const supabase = createAdminClient();
  const serverNow = new Date().toISOString();
  const generatedAt = output.generatedAt ?? serverNow;
  const calculatedAt = serverNow;

  const muscleBreakdown = output.muscleBreakdown ?? {};
  const rawData: Record<string, unknown> = {
    muscularScore: output.muscularScore ?? 0,
    cnsScore: output.cnsScore ?? 0,
    recommendation: output.recommendation ?? "rest",
    projectedFullRecovery: output.projectedFullRecovery ?? null,
    generatedAt,
  };

  await supabase.from("recovery_snapshots").upsert(
    {
      user_id: userId,
      snapshot_date: snapshotDate,
      readiness_score: output.overallScore ?? 0,
      sleep_score: output.sleepScore ?? 0,
      stress_score: output.stressScore ?? 0,
      muscle_breakdown: Object.keys(muscleBreakdown).length > 0 ? muscleBreakdown : null,
      overtraining_flag: output.overtrainingFlag === true,
      deload_flag: output.deloadFlag === true,
      sleep_debt: output.sleepDebt ?? 0,
      calculated_at: calculatedAt,
      raw_data: rawData,
      updated_at: calculatedAt,
    },
    { onConflict: "user_id,snapshot_date" }
  );
}
