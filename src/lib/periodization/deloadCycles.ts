/**
 * Active deload check and insert. Uses existing deload_cycles (reason, volume_reduction_pct, end_date nullable).
 */

import { createAdminClient } from "@/lib/supabase/admin";

export async function hasActiveDeload(userId: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("deload_cycles")
    .select("id")
    .eq("user_id", userId)
    .is("end_date", null)
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();

  if (error) return false;
  return data != null;
}

export async function getActiveDeloadReduction(userId: string): Promise<number | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("deload_cycles")
    .select("volume_reduction_pct")
    .eq("user_id", userId)
    .is("end_date", null)
    .is("deleted_at", null)
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || data == null) return null;
  const pct = data.volume_reduction_pct;
  return pct != null ? Number(pct) : null;
}

export async function startDeloadCycle(
  userId: string,
  startDate: string,
  triggerReason: string,
  volumeReductionPercent: number
): Promise<void> {
  const supabase = createAdminClient();
  const dateOnly = startDate.slice(0, 10);

  await supabase.from("deload_cycles").insert({
    user_id: userId,
    start_date: dateOnly,
    end_date: null,
    reason: triggerReason,
    volume_reduction_pct: Math.round(volumeReductionPercent),
  });
}
