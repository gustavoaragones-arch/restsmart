/**
 * Typed recovery API response — matches GET /api/recovery/calculate
 */

export interface RecoveryEngineOutput {
  muscularScore: number;
  muscleBreakdown: Record<string, number>;
  cnsScore: number;
  sleepScore: number;
  sleepDebt: number;
  stressScore: number;
  overallScore: number;
  recommendation: string;
  projectedFullRecovery: string | null;
  overtrainingFlag: boolean;
  deloadFlag: boolean;
  generatedAt: string;
}

export const EMPTY_RECOVERY: RecoveryEngineOutput = {
  muscularScore: 0,
  muscleBreakdown: {},
  cnsScore: 0,
  sleepScore: 0,
  sleepDebt: 0,
  stressScore: 0,
  overallScore: 0,
  recommendation: "rest",
  projectedFullRecovery: null,
  overtrainingFlag: false,
  deloadFlag: false,
  generatedAt: new Date().toISOString(),
};

export function normalizeRecoveryResponse(data: unknown): RecoveryEngineOutput {
  if (data == null || typeof data !== "object") return EMPTY_RECOVERY;
  const o = data as Record<string, unknown>;
  return {
    muscularScore: Number(o.muscularScore ?? o.muscular_score ?? 0),
    muscleBreakdown: (typeof o.muscleBreakdown === "object" && o.muscleBreakdown !== null
      ? o.muscleBreakdown
      : {}) as Record<string, number>,
    cnsScore: Number(o.cnsScore ?? o.cns_score ?? 0),
    sleepScore: Number(o.sleepScore ?? o.sleep_score ?? 0),
    sleepDebt: Number(o.sleepDebt ?? 0),
    stressScore: Number(o.stressScore ?? o.stress_score ?? 0),
    overallScore: Number(o.overallScore ?? o.overall_score ?? 0),
    recommendation: String(o.recommendation ?? "rest"),
    projectedFullRecovery: (() => {
      const v = o.projectedFullRecovery ?? o.projected_full_recovery_timestamp;
      return typeof v === "string" ? v : null;
    })(),
    overtrainingFlag: o.overtrainingFlag === true || o.overtraining_flag === true,
    deloadFlag: o.deloadFlag === true || o.deload_flag === true,
    generatedAt: String(o.generatedAt ?? new Date().toISOString()),
  };
}
