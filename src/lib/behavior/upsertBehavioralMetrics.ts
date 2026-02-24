/**
 * Upsert one row into behavioral_metrics for a given user/date.
 * Call after saving recovery snapshot.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import type { BehavioralOutput } from "./behaviorEngine";

export async function upsertBehavioralMetrics(
  userId: string,
  date: string,
  behavior: BehavioralOutput
): Promise<void> {
  const supabase = createAdminClient();
  const dateOnly = date.slice(0, 10);

  await supabase.from("behavioral_metrics").upsert(
    {
      user_id: userId,
      date: dateOnly,
      recovery_compliant: behavior.recoveryCompliant,
      sleep_target_met: behavior.sleepTargetMet,
      balanced_training: behavior.balancedTraining,
    },
    { onConflict: "user_id,date" }
  );
}
