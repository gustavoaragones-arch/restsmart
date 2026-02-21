/**
 * Recovery history API — fetches snapshots for charts
 * Uses existing recovery_snapshots. No schema changes.
 */

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import type { RecoveryHistoryPoint } from "@/types/recovery";

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

  if (!userId) {
    userId = "00000000-0000-0000-0000-000000000000";
  }

  const { searchParams } = new URL(req.url);
  const range = searchParams.get("range") ?? "7d";

  const days = range === "30d" ? 30 : 7;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startStr = startDate.toISOString().slice(0, 10);

  try {
    const admin = createAdminClient();
    const { data: rows, error } = await admin
      .from("recovery_snapshots")
      .select("snapshot_date, readiness_score, sleep_score, stress_score, sleep_debt, raw_data")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .gte("snapshot_date", startStr)
      .order("snapshot_date", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const points: RecoveryHistoryPoint[] = (rows ?? []).map((row) => {
      const raw = (row.raw_data as Record<string, unknown>) ?? {};
      const date = String(row.snapshot_date ?? "").slice(0, 10);
      return {
        date,
        overallScore: Number(row.readiness_score ?? 0),
        muscularScore: Number(raw.muscularScore ?? raw.muscular_score ?? 0),
        cnsScore: Number(raw.cnsScore ?? raw.cns_score ?? 0),
        sleepScore: Number(row.sleep_score ?? 0),
        stressScore: Number(row.stress_score ?? 0),
        sleepDebt: Number(row.sleep_debt ?? 0),
      };
    });

    return NextResponse.json({ points });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
