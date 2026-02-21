"use client";

import { useState, useEffect, useCallback } from "react";
import type { RecoveryHistoryPoint } from "@/types/recovery";

interface UseRecoveryHistoryState {
  points: RecoveryHistoryPoint[];
  loading: boolean;
  error: boolean;
  refetch: () => void;
}

function parsePoints(json: unknown): RecoveryHistoryPoint[] {
  if (json == null || typeof json !== "object") return [];
  const o = json as Record<string, unknown>;
  const arr = Array.isArray(o.points) ? o.points : [];
  return arr
    .filter((item): item is Record<string, unknown> => item != null && typeof item === "object")
    .map((item) => ({
      date: String(item.date ?? ""),
      overallScore: Number(item.overallScore ?? 0),
      muscularScore: Number(item.muscularScore ?? 0),
      cnsScore: Number(item.cnsScore ?? 0),
      sleepScore: Number(item.sleepScore ?? 0),
      stressScore: Number(item.stressScore ?? 0),
      sleepDebt: Number(item.sleepDebt ?? 0),
    }));
}

/**
 * Fetches recovery history from GET /api/recovery/history?range=7d
 */
export function useRecoveryHistory(range: "7d" | "30d" = "7d"): UseRecoveryHistoryState {
  const [points, setPoints] = useState<RecoveryHistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/recovery/history?range=${range}`);
      const json = await res.json();
      if (!res.ok || json.error) {
        setError(true);
        setPoints([]);
        return;
      }
      setPoints(parsePoints(json));
    } catch {
      setError(true);
      setPoints([]);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { points, loading, error, refetch: fetchHistory };
}
