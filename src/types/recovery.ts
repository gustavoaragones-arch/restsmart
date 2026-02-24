/**
 * Typed recovery API response — matches GET /api/recovery/calculate
 */

export interface RecoveryHistoryPoint {
  date: string;
  overallScore: number;
  muscularScore: number;
  cnsScore: number;
  sleepScore: number;
  stressScore: number;
  sleepDebt: number;
}

export interface BehavioralOutput {
  recoveryCompliant: boolean;
  sleepTargetMet: boolean;
  balancedTraining: boolean;
}

export interface StreakOutput {
  recoveryStreak: number;
  sleepStreak: number;
  balanceStreak: number;
}

export interface DeloadState {
  active: boolean;
  recommended: boolean;
  suggestedReductionPercent: number | null;
}

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
  behavior?: BehavioralOutput;
  streaks?: StreakOutput;
  deload?: DeloadState;
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
  behavior: {
    recoveryCompliant: false,
    sleepTargetMet: false,
    balancedTraining: false,
  },
  streaks: {
    recoveryStreak: 0,
    sleepStreak: 0,
    balanceStreak: 0,
  },
  deload: {
    active: false,
    recommended: false,
    suggestedReductionPercent: null,
  },
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
    behavior: (() => {
      const b = o.behavior;
      if (b != null && typeof b === "object") {
        const x = b as Record<string, unknown>;
        return {
          recoveryCompliant: x.recoveryCompliant === true,
          sleepTargetMet: x.sleepTargetMet === true,
          balancedTraining: x.balancedTraining === true,
        };
      }
      return {
        recoveryCompliant: false,
        sleepTargetMet: false,
        balancedTraining: false,
      };
    })(),
    streaks: (() => {
      const s = o.streaks;
      if (s != null && typeof s === "object") {
        const x = s as Record<string, unknown>;
        return {
          recoveryStreak: Math.max(0, Number(x.recoveryStreak) || 0),
          sleepStreak: Math.max(0, Number(x.sleepStreak) || 0),
          balanceStreak: Math.max(0, Number(x.balanceStreak) || 0),
        };
      }
      return { recoveryStreak: 0, sleepStreak: 0, balanceStreak: 0 };
    })(),
    deload: (() => {
      const d = o.deload;
      if (d != null && typeof d === "object") {
        const x = d as Record<string, unknown>;
        const pct = x.suggestedReductionPercent;
        return {
          active: x.active === true,
          recommended: x.recommended === true,
          suggestedReductionPercent:
            pct != null && Number.isFinite(Number(pct)) ? Number(pct) : null,
        };
      }
      return {
        active: false,
        recommended: false,
        suggestedReductionPercent: null,
      };
    })(),
  };
}
