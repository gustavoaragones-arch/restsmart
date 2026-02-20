/**
 * Shared types for /lib/recovery (Phase 2 — deterministic engine)
 */

export const MUSCLE_GROUPS = [
  "chest",
  "back",
  "shoulders",
  "arms",
  "quads",
  "hamstrings",
  "glutes",
  "calves",
  "core",
] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export interface WorkoutInput {
  id: string;
  workout_date: string;
  duration_minutes: number | null;
  perceived_exertion: number | null;
  name?: string | null;
  exercises?: { exercise_name: string; sets?: number | null; weight_kg?: number | null }[];
  muscle_groups?: { muscle_group: string; intensity?: string | null }[];
}

export interface SleepLogInput {
  sleep_date: string;
  total_minutes: number | null;
  quality: number | null;
  deep_sleep_minutes: number | null;
  rem_minutes: number | null;
  awakenings: number | null;
}

export interface StressLogInput {
  log_date: string;
  stress_level: number | null;
  hrv_ms: number | null;
}

export interface RecoverySnapshotInput {
  snapshot_date: string;
  readiness_score: number | null;
  sleep_score: number | null;
}

export interface RecoveryEngineInput {
  asOfDate: string;
  workouts: WorkoutInput[];
  sleepLogs: SleepLogInput[];
  stressLogs: StressLogInput[];
  recentSnapshots: RecoverySnapshotInput[];
  recentHrvMs?: number | null;
  baselineHrvMs?: number | null;
  ageYears?: number | null;
}

export type RPEIntensity = "light" | "moderate" | "heavy";

export type StressLevel = "low" | "moderate" | "high" | "very_high";
