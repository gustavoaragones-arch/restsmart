/**
 * Phase 2B — utils numeric safety
 */

import { clamp, safeNumber, hoursBetween, normalizeTo100 } from "../utils";

describe("recovery utils", () => {
  test("clamp returns value in range", () => {
    expect(clamp(50, 0, 100)).toBe(50);
    expect(clamp(-10, 0, 100)).toBe(0);
    expect(clamp(150, 0, 100)).toBe(100);
  });

  test("clamp returns min for NaN", () => {
    expect(clamp(Number.NaN, 0, 100)).toBe(0);
  });

  test("safeNumber returns fallback for null/undefined/NaN", () => {
    expect(safeNumber(null, 5)).toBe(5);
    expect(safeNumber(undefined, 5)).toBe(5);
    expect(safeNumber(Number.NaN, 5)).toBe(5);
    expect(safeNumber(10, 5)).toBe(10);
  });

  test("hoursBetween never negative", () => {
    expect(hoursBetween("2025-02-20", "2025-02-19")).toBe(0);
    expect(hoursBetween("2025-02-19", "2025-02-20")).toBeGreaterThanOrEqual(0);
  });

  test("normalizeTo100 returns 0 for invalid", () => {
    expect(normalizeTo100(50, 0)).toBe(0);
    expect(normalizeTo100(Number.NaN, 100)).toBe(0);
  });
});
