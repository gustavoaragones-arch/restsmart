/**
 * Fetch up to 60 most recent behavioral_metrics rows for a user.
 * Ordered by date DESC (most recent first).
 */

import { createAdminClient } from "@/lib/supabase/admin";

export interface BehaviorRow {
  date: string;
  recovery_compliant: boolean;
  sleep_target_met: boolean;
  balanced_training: boolean;
}

const MAX_LOOKBACK_DAYS = 60;

export async function fetchBehaviorHistory(userId: string): Promise<BehaviorRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("behavioral_metrics")
    .select("date, recovery_compliant, sleep_target_met, balanced_training")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .limit(MAX_LOOKBACK_DAYS);

  if (error) return [];

  return (data ?? []).map((row: Record<string, unknown>) => ({
    date: String(row.date ?? "").slice(0, 10),
    recovery_compliant: row.recovery_compliant === true,
    sleep_target_met: row.sleep_target_met === true,
    balanced_training: row.balanced_training === true,
  }));
}
