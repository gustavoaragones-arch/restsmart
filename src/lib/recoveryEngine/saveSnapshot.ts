/**
 * Save recovery snapshot to recovery_snapshots table
 */

import { createAdminClient } from "@/lib/supabase/admin";
import type { RecoveryScoreOutput } from "./types";

export async function saveRecoverySnapshot(
  userId: string,
  snapshotDate: string,
  output: RecoveryScoreOutput
): Promise<void> {
  const supabase = createAdminClient();

  await supabase.from("recovery_snapshots").upsert(
    {
      user_id: userId,
      snapshot_date: snapshotDate,
      readiness_score: output.overall_score,
      sleep_score: output.sleep_score,
      stress_score: output.stress_score,
      raw_data: {
        muscular_score: output.muscular_score,
        cns_score: output.cns_score,
        recommendation: output.recommendation,
        projected_full_recovery_timestamp: output.projected_full_recovery_timestamp,
        overtraining_flag: output.overtraining_flag,
        deload_flag: output.deload_flag,
        ...output.raw_data,
      },
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,snapshot_date" }
  );
}
