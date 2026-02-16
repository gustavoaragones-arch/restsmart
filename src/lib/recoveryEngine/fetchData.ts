/**
 * Fetch user data for recovery calculation
 */

import { createAdminClient } from "@/lib/supabase/admin";
import type {
  RecoveryEngineInput,
  WorkoutInput,
  WorkoutExerciseInput,
  WorkoutMuscleGroupInput,
  SleepLogInput,
  StressLogInput,
} from "./types";

/** Default lookback for fetching */
const WORKOUT_DAYS = 14;
const SLEEP_DAYS = 7;
const STRESS_DAYS = 7;

export async function fetchRecoveryData(
  userId: string,
  asOfDate: string
): Promise<RecoveryEngineInput> {
  const supabase = createAdminClient();
  const asOf = new Date(asOfDate);
  const workoutFrom = new Date(asOf);
  workoutFrom.setDate(workoutFrom.getDate() - WORKOUT_DAYS);
  const sleepStressFrom = new Date(asOf);
  sleepStressFrom.setDate(sleepStressFrom.getDate() - SLEEP_DAYS);

  const [workoutsRes, exercisesRes, muscleGroupsRes, sleepRes, stressRes] =
    await Promise.all([
      supabase
        .from("workouts")
        .select("id, workout_date, duration_minutes, perceived_exertion, notes")
        .eq("user_id", userId)
        .gte("workout_date", workoutFrom.toISOString().slice(0, 10))
        .lte("workout_date", asOf.toISOString().slice(0, 10))
        .is("deleted_at", null)
        .order("workout_date", { ascending: false }),
      supabase
        .from("workout_exercises")
        .select("workout_id, sets, reps_per_set, weight_kg, duration_seconds, exercise_name")
        .eq("user_id", userId)
        .is("deleted_at", null),
      supabase
        .from("workout_muscle_groups")
        .select("workout_id, muscle_group, intensity")
        .eq("user_id", userId)
        .is("deleted_at", null),
    supabase
      .from("sleep_logs")
      .select("sleep_date, total_minutes, quality, deep_sleep_minutes, rem_minutes, light_sleep_minutes, awakenings")
      .eq("user_id", userId)
      .gte("sleep_date", sleepStressFrom.toISOString().slice(0, 10))
      .lte("sleep_date", asOf.toISOString().slice(0, 10))
      .is("deleted_at", null)
      .order("sleep_date", { ascending: false }),
    supabase
      .from("stress_logs")
      .select("log_date, stress_level, hrv_ms, resting_hr")
      .eq("user_id", userId)
      .gte("log_date", sleepStressFrom.toISOString().slice(0, 10))
      .lte("log_date", asOf.toISOString().slice(0, 10))
      .is("deleted_at", null)
      .order("log_date", { ascending: false }),
  ]);

  const exercisesByWorkout = new Map<string, WorkoutExerciseInput[]>();
  for (const e of exercisesRes.data ?? []) {
    const wid = e.workout_id as string;
    if (!exercisesByWorkout.has(wid)) exercisesByWorkout.set(wid, []);
    exercisesByWorkout.get(wid)!.push({
      sets: e.sets as number | null,
      reps_per_set: e.reps_per_set as number[] | null,
      weight_kg: e.weight_kg as number | null,
      duration_seconds: e.duration_seconds as number | null,
      exercise_name: e.exercise_name as string,
    });
  }
  const muscleGroupsByWorkout = new Map<string, WorkoutMuscleGroupInput[]>();
  for (const m of muscleGroupsRes.data ?? []) {
    const wid = m.workout_id as string;
    if (!muscleGroupsByWorkout.has(wid)) muscleGroupsByWorkout.set(wid, []);
    muscleGroupsByWorkout.get(wid)!.push({
      muscle_group: m.muscle_group as string,
      intensity: m.intensity as WorkoutMuscleGroupInput["intensity"],
    });
  }

  const workouts: WorkoutInput[] = (workoutsRes.data ?? []).map((w: Record<string, unknown>) => ({
    id: w.id as string,
    workout_date: w.workout_date as string,
    duration_minutes: w.duration_minutes as number | null,
    perceived_exertion: w.perceived_exertion as number | null,
    name: w.name as string | null,
    notes: w.notes as string | null,
    exercises: exercisesByWorkout.get(w.id as string) ?? [],
    muscle_groups: muscleGroupsByWorkout.get(w.id as string) ?? [],
  }));

  const sleepLogs: SleepLogInput[] = (sleepRes.data ?? []).map((s: Record<string, unknown>) => ({
    sleep_date: s.sleep_date as string,
    total_minutes: s.total_minutes as number | null,
    quality: s.quality as number | null,
    deep_sleep_minutes: s.deep_sleep_minutes as number | null,
    rem_minutes: s.rem_minutes as number | null,
    light_sleep_minutes: s.light_sleep_minutes as number | null,
    awakenings: s.awakenings as number | null,
  }));

  const stressLogs: StressLogInput[] = (stressRes.data ?? []).map((s: Record<string, unknown>) => ({
    log_date: s.log_date as string,
    stress_level: s.stress_level as number | null,
    hrv_ms: s.hrv_ms as number | null,
    resting_hr: s.resting_hr as number | null,
  }));

  const dateStr = asOfDate.slice(0, 10);
  const todayStress = stressLogs.find((s) => s.log_date === dateStr);
  const recentHrv = todayStress?.hrv_ms ?? stressLogs[0]?.hrv_ms ?? null;
  const baselineHrv = stressLogs.length >= 3
    ? stressLogs.reduce((s, l) => s + (l.hrv_ms ?? 0), 0) / stressLogs.filter((l) => l.hrv_ms != null).length
    : null;

  return {
    userId,
    asOfDate: dateStr,
    workouts,
    sleepLogs,
    stressLogs,
    recentHrvMs: recentHrv,
    baselineHrvMs: baselineHrv ? Math.round(baselineHrv) : null,
  };
}
