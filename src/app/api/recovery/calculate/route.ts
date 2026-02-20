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
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") ?? new Date().toISOString().slice(0, 10);
  const save = searchParams.get("save") === "true";

  try {
    const input = await fetchRecoveryInput(user.id, date);
    const output = runRecoveryEngine(input);

    if (save) {
      const { createAdminClient } = await import("@/lib/supabase/admin");
      const admin = createAdminClient();
      const { data: existing } = await admin
        .from("recovery_snapshots")
        .select("id")
        .eq("user_id", user.id)
        .eq("snapshot_date", date.slice(0, 10))
        .is("deleted_at", null)
        .maybeSingle();
      if (!existing) {
        await saveSnapshot(user.id, date.slice(0, 10), output);
      }
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
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
