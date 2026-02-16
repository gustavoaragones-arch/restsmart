/**
 * Calculate recovery and optionally save snapshot
 * Trigger: workout logged, sleep logged, dashboard opened
 */

import { createClient } from "@/lib/supabase/server";
import {
  fetchRecoveryData,
  calculateRecovery,
  saveRecoverySnapshot,
} from "@/lib/recoveryEngine";
import { createAdminClient } from "@/lib/supabase/admin";
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
    const input = await fetchRecoveryData(user.id, date);

    const adminSupabase = createAdminClient();
    const { data: deloadCycles } = await adminSupabase
      .from("deload_cycles")
      .select("start_date, end_date")
      .eq("user_id", user.id)
      .is("deleted_at", null);

    const output = calculateRecovery(input, deloadCycles ?? []);

    if (save) {
      await saveRecoverySnapshot(user.id, date.slice(0, 10), output);
    }

    return NextResponse.json(output);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
