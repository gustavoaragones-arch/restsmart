"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { RecoveryHistoryPoint } from "@/types/recovery";

interface SleepDebtChartProps {
  points: RecoveryHistoryPoint[];
}

export function SleepDebtChart({ points }: SleepDebtChartProps) {
  if (points.length === 0) {
    return null;
  }

  const data = points.map((p) => ({
    date: p.date.slice(5),
    sleepDebt: Math.max(0, Number(p.sleepDebt) || 0) / 60,
  }));

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="date"
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            stroke="#475569"
          />
          <YAxis
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            stroke="#475569"
            tickFormatter={(v) => `${v}h`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1e293b",
              border: "1px solid #334155",
              borderRadius: "8px",
            }}
            labelStyle={{ color: "#e2e8f0" }}
            formatter={(value: number | undefined) => [`${(value ?? 0).toFixed(1)}h`, "Sleep debt"]}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Bar
            dataKey="sleepDebt"
            fill="#64748b"
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
