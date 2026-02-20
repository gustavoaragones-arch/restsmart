/**
 * Fetch data from Supabase and build RecoveryEngineInput for /lib/recovery
 */

import { createAdminClient } from "@/lib/supabase/admin";
import type { RecoveryEngineInput, WorkoutInput, SleepLogInput, StressLogInput, RecoverySnapshotInput } from "./types";

const WORKOUT_DAYS = 14;
const SLEEP_STRESS_DAYS = 7;
const SNAPSHOT_DAYS = 14;

export async function fetchRecoveryInput(
  userId: string,
  asOfDate: string
): Promise<RecoveryEngineInput> {
  const supabase = createAdminClient();
  const asOf = new Date(asOfDate);
  const workoutFrom = new Date(asOf);
  workoutFrom.setDate(workoutFrom.getDate() - WORKOUT_DAYS);
  const ssFrom = new Date(asOf);
  ssFrom.setDate(ssFrom.getDate() - SLEEP_STRESS_DAYS);
  const snapFrom = new Date(asOf);
  snapFrom.setDate(snapFrom.getDate() - SNAPSHOT_DAYS);

  const [workoutsRes, sleepRes, stressRes, snapRes] = await Promise.all([
    supabase
      .from("workouts")
      .select("id, workout_date, duration_minutes, perceived_exertion, name")
      .eq("user_id", userId)
      .gte("workout_date", workoutFrom.toISOString().slice(0, 10))
      .lte("workout_date", asOf.toISOString().slice(0, 10))
      .is("deleted_at", null)
      .order("workout_date", { ascending: false }),
    supabase
      .from("sleep_logs")
      .select("sleep_date, total_minutes, quality, deep_sleep_minutes, rem_minutes, awakenings")
      .eq("user_id", userId)
      .gte("sleep_date", ssFrom.toISOString().slice(0, 10))
      .lte("sleep_date", asOf.toISOString().slice(0, 10))
      .is("deleted_at", null)
      .order("sleep_date", { ascending: false }),
    supabase
      .from("stress_logs")
      .select("log_date, stress_level, hrv_ms")
      .eq("user_id", userId)
      .gte("log_date", ssFrom.toISOString().slice(0, 10))
      .lte("log_date", asOf.toISOString().slice(0, 10))
      .is("deleted_at", null)
      .order("log_date", { ascending: false }),
    supabase
      .from("recovery_snapshots")
      .select("snapshot_date, readiness_score, sleep_score")
      .eq("user_id", userId)
      .gte("snapshot_date", snapFrom.toISOString().slice(0, 10))
      .lte("snapshot_date", asOf.toISOString().slice(0, 10))
      .is("deleted_at", null)
      .order("snapshot_date", { ascending: false })
      .limit(14),
  ]);

  const workouts: WorkoutInput[] = (workoutsRes.data ?? []).map((w: Record<string, unknown>) => ({
    id: w.id as string,
    workout_date: w.workout_date as string,
    duration_minutes: w.duration_minutes as number | null,
    perceived_exertion: w.perceived_exertion as number | null,
    name: w.name as string | null,
  }));

  const sleepLogs: SleepLogInput[] = (sleepRes.data ?? []).map((s: Record<string, unknown>) => ({
    sleep_date: s.sleep_date as string,
    total_minutes: s.total_minutes as number | null,
    quality: s.quality as number | null,
    deep_sleep_minutes: s.deep_sleep_minutes as number | null,
    rem_minutes: s.rem_minutes as number | null,
    awakenings: s.awakenings as number | null,
  }));

  const stressLogs: StressLogInput[] = (stressRes.data ?? []).map((s: Record<string, unknown>) => ({
    log_date: s.log_date as string,
    stress_level: s.stress_level as number | null,
    hrv_ms: s.hrv_ms as number | null,
  }));

  const recentSnapshots: RecoverySnapshotInput[] = (snapRes.data ?? []).map((s: Record<string, unknown>) => ({
    snapshot_date: s.snapshot_date as string,
    readiness_score: s.readiness_score as number | null,
    sleep_score: s.sleep_score as number | null,
  }));

  const todayStress = stressLogs.find((s) => s.log_date === asOfDate.slice(0, 10));
  const recentHrv = todayStress?.hrv_ms ?? stressLogs[0]?.hrv_ms ?? null;
  const withHrv = stressLogs.filter((s) => s.hrv_ms != null);
  const baselineHrv = withHrv.length >= 3
    ? withHrv.reduce((a, s) => a + (s.hrv_ms ?? 0), 0) / withHrv.length
    : null;

  return {
    asOfDate: asOfDate.slice(0, 10),
    workouts,
    sleepLogs,
    stressLogs,
    recentSnapshots,
    recentHrvMs: recentHrv,
    baselineHrvMs: baselineHrv ? Math.round(baselineHrv) : null,
  };
}
