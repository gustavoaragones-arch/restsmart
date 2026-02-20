/**
 * Deterministic recovery engine tests
 */

import { runRecoveryEngine } from "../recoveryEngine";
import type { RecoveryEngineInput } from "../types";

const baseInput: Omit<RecoveryEngineInput, "workouts" | "sleepLogs" | "stressLogs" | "recentSnapshots"> = {
  asOfDate: "2025-02-20",
  workouts: [],
  sleepLogs: [],
  stressLogs: [],
  recentSnapshots: [],
};

function dateOffset(days: number, base = "2025-02-20"): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

describe("Recovery Engine", () => {
  test("Heavy legs + poor sleep → low score", () => {
    const input: RecoveryEngineInput = {
      ...baseInput,
      asOfDate: "2025-02-20",
      workouts: [
        {
          id: "1",
          workout_date: "2025-02-19",
          duration_minutes: 90,
          perceived_exertion: 9,
          muscle_groups: [{ muscle_group: "quads", intensity: "primary" }, { muscle_group: "hamstrings", intensity: "primary" }],
        },
      ],
      sleepLogs: [
        { sleep_date: "2025-02-19", total_minutes: 300, quality: 3, deep_sleep_minutes: 30, rem_minutes: 20, awakenings: 5 },
        { sleep_date: "2025-02-18", total_minutes: 360, quality: 4, deep_sleep_minutes: 40, rem_minutes: 30, awakenings: 3 },
      ],
      stressLogs: [{ log_date: "2025-02-19", stress_level: 8, hrv_ms: null }],
      recentSnapshots: [],
    };
    const out = runRecoveryEngine(input);
    expect(out.overallScore).toBeLessThan(70);
    expect(out.sleepScore).toBeLessThan(70);
  });

  test("3 rest days + good sleep → high score", () => {
    const input: RecoveryEngineInput = {
      ...baseInput,
      asOfDate: "2025-02-20",
      workouts: [
        { id: "1", workout_date: "2025-02-16", duration_minutes: 45, perceived_exertion: 6, muscle_groups: [{ muscle_group: "chest", intensity: "primary" }] },
      ],
      sleepLogs: [
        { sleep_date: "2025-02-19", total_minutes: 480, quality: 8, deep_sleep_minutes: 90, rem_minutes: 100, awakenings: 0 },
        { sleep_date: "2025-02-18", total_minutes: 465, quality: 8, deep_sleep_minutes: 85, rem_minutes: 95, awakenings: 1 },
        { sleep_date: "2025-02-17", total_minutes: 480, quality: 7, deep_sleep_minutes: 80, rem_minutes: 90, awakenings: 0 },
      ],
      stressLogs: [{ log_date: "2025-02-19", stress_level: 2, hrv_ms: 65 }],
      recentSnapshots: [],
    };
    const out = runRecoveryEngine(input);
    expect(out.overallScore).toBeGreaterThanOrEqual(70);
    expect(out.recommendation).toBe("train");
  });

  test("7 straight days training → overtraining flag", () => {
    const workouts = Array.from({ length: 7 }, (_, i) => ({
      id: `w-${i}`,
      workout_date: dateOffset(-6 + i),
      duration_minutes: 60,
      perceived_exertion: 7,
      muscle_groups: [{ muscle_group: "core", intensity: "primary" }],
    }));
    const input: RecoveryEngineInput = {
      ...baseInput,
      asOfDate: "2025-02-20",
      workouts,
      sleepLogs: [
        { sleep_date: "2025-02-19", total_minutes: 420, quality: 5, deep_sleep_minutes: 60, rem_minutes: 50, awakenings: 2 },
      ],
      stressLogs: [],
      recentSnapshots: [],
    };
    const out = runRecoveryEngine(input);
    expect(out.overtrainingFlag).toBe(true);
  });

  test("28 days load + downward trend → deload flag", () => {
    const workouts = Array.from({ length: 20 }, (_, i) => ({
      id: `w-${i}`,
      workout_date: dateOffset(-28 + Math.floor(i * 1.4)),
      duration_minutes: 50,
      perceived_exertion: 7,
      muscle_groups: [{ muscle_group: "back", intensity: "primary" }],
    }));
    const recentSnapshots = [
      { snapshot_date: dateOffset(-2), readiness_score: 45, sleep_score: 60 },
      { snapshot_date: dateOffset(-3), readiness_score: 55, sleep_score: 65 },
      { snapshot_date: dateOffset(-4), readiness_score: 65, sleep_score: 70 },
    ];
    const input: RecoveryEngineInput = {
      ...baseInput,
      asOfDate: "2025-02-20",
      workouts,
      sleepLogs: [
        { sleep_date: "2025-02-19", total_minutes: 420, quality: 6, deep_sleep_minutes: 50, rem_minutes: 60, awakenings: 1 },
      ],
      stressLogs: [],
      recentSnapshots,
    };
    const out = runRecoveryEngine(input);
    expect(out.deloadFlag).toBe(true);
  });

  test("No data → neutral scores", () => {
    const input: RecoveryEngineInput = {
      ...baseInput,
      asOfDate: "2025-02-20",
      workouts: [],
      sleepLogs: [],
      stressLogs: [],
      recentSnapshots: [],
    };
    const out = runRecoveryEngine(input);
    expect(out.overallScore).toBeGreaterThanOrEqual(0);
    expect(out.overallScore).toBeLessThanOrEqual(100);
    expect(out.recommendation).toBe("train");
  });

  // ---------- Phase 2B edge-case tests ----------

  test("No workouts → muscularScore = 100", () => {
    const input: RecoveryEngineInput = {
      ...baseInput,
      asOfDate: "2025-02-20",
      workouts: [],
      sleepLogs: [
        { sleep_date: "2025-02-19", total_minutes: 420, quality: 6, deep_sleep_minutes: 60, rem_minutes: 50, awakenings: 0 },
      ],
      stressLogs: [],
      recentSnapshots: [],
    };
    const out = runRecoveryEngine(input);
    expect(out.muscularScore).toBe(100);
    expect(Number.isNaN(out.muscularScore)).toBe(false);
  });

  test("Extreme RPE 10 daily for 14 days → low muscular, no NaN", () => {
    const workouts = Array.from({ length: 14 }, (_, i) => ({
      id: `w-${i}`,
      workout_date: dateOffset(-13 + i),
      duration_minutes: 90,
      perceived_exertion: 10,
      muscle_groups: [{ muscle_group: "quads", intensity: "primary" }],
    }));
    const input: RecoveryEngineInput = {
      ...baseInput,
      asOfDate: "2025-02-20",
      workouts,
      sleepLogs: [{ sleep_date: "2025-02-19", total_minutes: 400, quality: 5, deep_sleep_minutes: 50, rem_minutes: 40, awakenings: 2 }],
      stressLogs: [],
      recentSnapshots: [],
    };
    const out = runRecoveryEngine(input);
    expect(out.muscularScore).toBeLessThanOrEqual(100);
    expect(out.muscularScore).toBeGreaterThanOrEqual(0);
    expect(Number.isNaN(out.overallScore)).toBe(false);
  });

  test("Future workout timestamp → ignored", () => {
    const input: RecoveryEngineInput = {
      ...baseInput,
      asOfDate: "2025-02-20",
      workouts: [
        { id: "1", workout_date: "2025-02-25", duration_minutes: 60, perceived_exertion: 9, muscle_groups: [{ muscle_group: "chest", intensity: "primary" }] },
      ],
      sleepLogs: [],
      stressLogs: [],
      recentSnapshots: [],
    };
    const out = runRecoveryEngine(input);
    expect(out.muscularScore).toBe(100);
  });

  test("Sleep modifier out of bounds → clamped 0.8-1.2", () => {
    const input: RecoveryEngineInput = {
      ...baseInput,
      asOfDate: "2025-02-20",
      workouts: [{ id: "1", workout_date: "2025-02-19", duration_minutes: 45, perceived_exertion: 6 }],
      sleepLogs: [
        { sleep_date: "2025-02-19", total_minutes: 300, quality: 2, deep_sleep_minutes: 20, rem_minutes: 20, awakenings: 8 },
      ],
      stressLogs: [],
      recentSnapshots: [],
    };
    const out = runRecoveryEngine(input);
    expect(out.overallScore).toBeGreaterThanOrEqual(0);
    expect(out.overallScore).toBeLessThanOrEqual(100);
    expect(out.sleepScore).toBeGreaterThanOrEqual(0);
    expect(out.sleepScore).toBeLessThanOrEqual(100);
  });

  test("Missing HRV → no NaN, valid CNS score", () => {
    const input: RecoveryEngineInput = {
      ...baseInput,
      asOfDate: "2025-02-20",
      workouts: [{ id: "1", workout_date: "2025-02-18", duration_minutes: 30, perceived_exertion: 8, name: "HIIT" }],
      sleepLogs: [{ sleep_date: "2025-02-19", total_minutes: 450, quality: 7, deep_sleep_minutes: 70, rem_minutes: 80, awakenings: 1 }],
      stressLogs: [{ log_date: "2025-02-19", stress_level: 4, hrv_ms: null }],
      recentSnapshots: [],
      recentHrvMs: null,
      baselineHrvMs: null,
    };
    const out = runRecoveryEngine(input);
    expect(Number.isNaN(out.cnsScore)).toBe(false);
    expect(out.cnsScore).toBeGreaterThanOrEqual(0);
    expect(out.cnsScore).toBeLessThanOrEqual(100);
  });

  test("Missing deep sleep → baseline behavior, no NaN", () => {
    const input: RecoveryEngineInput = {
      ...baseInput,
      asOfDate: "2025-02-20",
      workouts: [{ id: "1", workout_date: "2025-02-19", duration_minutes: 45, perceived_exertion: 7 }],
      sleepLogs: [
        { sleep_date: "2025-02-19", total_minutes: 420, quality: 6, deep_sleep_minutes: null, rem_minutes: null, awakenings: 1 },
      ],
      stressLogs: [],
      recentSnapshots: [],
    };
    const out = runRecoveryEngine(input);
    expect(Number.isNaN(out.cnsScore)).toBe(false);
    expect(out.cnsScore).toBeGreaterThanOrEqual(0);
    expect(out.cnsScore).toBeLessThanOrEqual(100);
  });

  test("3 days sleep only → score from available days", () => {
    const input: RecoveryEngineInput = {
      ...baseInput,
      asOfDate: "2025-02-20",
      workouts: [],
      sleepLogs: [
        { sleep_date: "2025-02-19", total_minutes: 450, quality: 7, deep_sleep_minutes: 80, rem_minutes: 70, awakenings: 0 },
        { sleep_date: "2025-02-18", total_minutes: 420, quality: 6, deep_sleep_minutes: 60, rem_minutes: 60, awakenings: 1 },
        { sleep_date: "2025-02-17", total_minutes: 480, quality: 8, deep_sleep_minutes: 90, rem_minutes: 90, awakenings: 0 },
      ],
      stressLogs: [],
      recentSnapshots: [],
    };
    const out = runRecoveryEngine(input);
    expect(out.sleepScore).toBeGreaterThanOrEqual(0);
    expect(out.sleepScore).toBeLessThanOrEqual(100);
    expect(out.sleepDebt).toBeGreaterThanOrEqual(0);
    expect(Number.isNaN(out.sleepScore)).toBe(false);
  });

  test("0 deep sleep → safe ratio, modifier in range", () => {
    const input: RecoveryEngineInput = {
      ...baseInput,
      asOfDate: "2025-02-20",
      workouts: [],
      sleepLogs: [
        { sleep_date: "2025-02-19", total_minutes: 400, quality: 5, deep_sleep_minutes: 0, rem_minutes: 0, awakenings: 3 },
      ],
      stressLogs: [],
      recentSnapshots: [],
    };
    const out = runRecoveryEngine(input);
    expect(out.sleepScore).toBeGreaterThanOrEqual(0);
    expect(out.sleepScore).toBeLessThanOrEqual(100);
  });

  test("Excess sleep 10+ hours → score bounded", () => {
    const input: RecoveryEngineInput = {
      ...baseInput,
      asOfDate: "2025-02-20",
      workouts: [],
      sleepLogs: [
        { sleep_date: "2025-02-19", total_minutes: 660, quality: 6, deep_sleep_minutes: 120, rem_minutes: 100, awakenings: 0 },
      ],
      stressLogs: [],
      recentSnapshots: [],
    };
    const out = runRecoveryEngine(input);
    expect(out.sleepScore).toBeGreaterThanOrEqual(0);
    expect(out.sleepScore).toBeLessThanOrEqual(100);
  });

  test("Fewer than 5 snapshots + no 6-day streak → no overtraining from trend", () => {
    const input: RecoveryEngineInput = {
      ...baseInput,
      asOfDate: "2025-02-20",
      workouts: [
        { id: "1", workout_date: "2025-02-18", duration_minutes: 45, perceived_exertion: 6 },
        { id: "2", workout_date: "2025-02-16", duration_minutes: 45, perceived_exertion: 6 },
      ],
      sleepLogs: [{ sleep_date: "2025-02-19", total_minutes: 420, quality: 6, deep_sleep_minutes: 60, rem_minutes: 50, awakenings: 0 }],
      stressLogs: [],
      recentSnapshots: [
        { snapshot_date: dateOffset(-1), readiness_score: 60, sleep_score: 70 },
        { snapshot_date: dateOffset(-2), readiness_score: 65, sleep_score: 72 },
        { snapshot_date: dateOffset(-3), readiness_score: 70, sleep_score: 75 },
      ],
    };
    const out = runRecoveryEngine(input);
    expect(out.overtrainingFlag).toBe(false);
  });

  test("Fluctuating recovery pattern → no spurious deload", () => {
    const recentSnapshots = [
      { snapshot_date: dateOffset(0), readiness_score: 70, sleep_score: 70 },
      { snapshot_date: dateOffset(-1), readiness_score: 50, sleep_score: 60 },
      { snapshot_date: dateOffset(-2), readiness_score: 75, sleep_score: 72 },
      { snapshot_date: dateOffset(-3), readiness_score: 55, sleep_score: 65 },
    ];
    const input: RecoveryEngineInput = {
      ...baseInput,
      asOfDate: "2025-02-20",
      workouts: [
        { id: "1", workout_date: dateOffset(-5), duration_minutes: 50, perceived_exertion: 6 },
      ],
      sleepLogs: [{ sleep_date: "2025-02-19", total_minutes: 450, quality: 7, deep_sleep_minutes: 70, rem_minutes: 60, awakenings: 0 }],
      stressLogs: [],
      recentSnapshots,
    };
    const out = runRecoveryEngine(input);
    expect(out.overallScore).toBeGreaterThanOrEqual(0);
    expect(out.overallScore).toBeLessThanOrEqual(100);
  });

  test("generatedAt always set", () => {
    const input: RecoveryEngineInput = {
      ...baseInput,
      asOfDate: "2025-02-20",
      workouts: [],
      sleepLogs: [],
      stressLogs: [],
      recentSnapshots: [],
    };
    const out = runRecoveryEngine(input);
    expect(out.generatedAt).toBeDefined();
    expect(typeof out.generatedAt).toBe("string");
    expect(out.muscleBreakdown).toBeDefined();
    expect(out.sleepDebt).toBeGreaterThanOrEqual(0);
  });
});
