/**
 * Trigger recovery recalculation and save snapshot
 * Call on: workout creation, sleep log creation, dashboard load if no snapshot today
 */

import { fetchRecoveryInput } from "./fetchRecoveryInput";
import { runRecoveryEngine } from "./recoveryEngine";
import { saveSnapshot } from "./saveSnapshot";

export async function triggerRecoveryRecalculation(userId: string): Promise<void> {
  const date = new Date().toISOString().slice(0, 10);
  const input = await fetchRecoveryInput(userId, date);
  const output = runRecoveryEngine(input);
  await saveSnapshot(userId, date, output);
}
