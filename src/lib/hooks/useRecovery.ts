"use client";

import { useState, useEffect, useCallback } from "react";
import type { RecoveryEngineOutput } from "@/types/recovery";
import { normalizeRecoveryResponse } from "@/types/recovery";

interface UseRecoveryState {
  data: RecoveryEngineOutput | null;
  loading: boolean;
  error: boolean;
  refetch: () => void;
}

/**
 * Fetches recovery from GET /api/recovery/calculate.
 * On dashboard load with save=true, server ensures today snapshot exists and returns fresh result.
 * Never returns undefined fields; use normalized response.
 */
export function useRecovery(options?: { save?: boolean }): UseRecoveryState {
  const [data, setData] = useState<RecoveryEngineOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchRecovery = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const url = options?.save !== false ? "/api/recovery/calculate?save=true" : "/api/recovery/calculate";
      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok || json.error) {
        setError(true);
        setData(null);
        return;
      }
      const normalized = normalizeRecoveryResponse(json);
      setData(normalized);
    } catch {
      setError(true);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [options?.save]);

  useEffect(() => {
    fetchRecovery();
  }, [fetchRecovery]);

  return { data, loading, error, refetch: fetchRecovery };
}
