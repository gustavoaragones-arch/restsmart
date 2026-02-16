/**
 * Recovery recalculation triggers
 * Call these after workout/sleep mutations to update snapshot
 */

import { fetchRecoveryData } from "./fetchData";
import { calculateRecovery } from "./index";
import { saveRecoverySnapshot } from "./saveSnapshot";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Recalculate and save recovery for a user as of today.
 * Call after: workout logged, sleep logged.
 */
export async function triggerRecoveryRecalculation(userId: string): Promise<void> {
  const date = new Date().toISOString().slice(0, 10);
  const input = await fetchRecoveryData(userId, date);

  const adminSupabase = createAdminClient();
  const { data: deloadCycles } = await adminSupabase
    .from("deload_cycles")
    .select("start_date, end_date")
    .eq("user_id", userId)
    .is("deleted_at", null);

  const output = calculateRecovery(input, deloadCycles ?? []);
  await saveRecoverySnapshot(userId, date, output);
}
