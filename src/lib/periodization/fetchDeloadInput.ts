/**
 * Fetch last 28 days of recovery snapshots for deload detection.
 */

import { createAdminClient } from "@/lib/supabase/admin";

export interface DeloadSnapshotRow {
  snapshot_date: string;
  readiness_score: number | null;
  overtraining_flag: boolean;
  sleep_debt: number | null;
}

export async function fetchDeloadInput(
  userId: string,
  asOfDate: string
): Promise<DeloadSnapshotRow[]> {
  const supabase = createAdminClient();
  const asOf = new Date(asOfDate.slice(0, 10));
  const from = new Date(asOf);
  from.setDate(from.getDate() - 28);
  const fromStr = from.toISOString().slice(0, 10);
  const toStr = asOf.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("recovery_snapshots")
    .select("snapshot_date, readiness_score, overtraining_flag, sleep_debt")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .gte("snapshot_date", fromStr)
    .lte("snapshot_date", toStr)
    .order("snapshot_date", { ascending: true });

  if (error) return [];

  return (data ?? []).map((row: Record<string, unknown>) => ({
    snapshot_date: String(row.snapshot_date ?? "").slice(0, 10),
    readiness_score: row.readiness_score != null ? Number(row.readiness_score) : null,
    overtraining_flag: row.overtraining_flag === true,
    sleep_debt: row.sleep_debt != null ? Number(row.sleep_debt) : null,
  }));
}
