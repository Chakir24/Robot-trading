"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface Props {
  timeframes: Record<
    string,
    { rsi: number; macdHistogram: number; probabilityScore: number }
  >;
}

export function IndicatorsRadar({ timeframes }: Props) {
  const entries = Object.entries(timeframes);
  const macdValues = entries.map(([, d]) => d.macdHistogram);
  const macdMin = Math.min(...macdValues);
  const macdMax = Math.max(...macdValues);
  const macdRange = macdMax - macdMin || 1;

  const data = entries.map(([tf, d]) => ({
    timeframe: tf,
    RSI: Math.round(d.rsi),
    "MACD": Math.round(((d.macdHistogram - macdMin) / macdRange) * 100),
    Confidence: d.probabilityScore,
    fullMark: 100,
  }));

  return (
    <div className="rounded-xl border border-zinc-700/50 bg-zinc-900/50 p-5">
      <h3 className="mb-4 text-sm font-semibold text-zinc-300">
        Indicators Overview
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data}>
            <PolarGrid stroke="#3f3f46" />
            <PolarAngleAxis
              dataKey="timeframe"
              tick={{ fill: "#a1a1aa", fontSize: 11 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: "#71717a", fontSize: 9 }}
            />
            <Radar
              name="RSI"
              dataKey="RSI"
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={0.3}
              strokeWidth={2}
            />
            <Radar
              name="MACD (norm)"
              dataKey="MACD"
              stroke="#a855f7"
              fill="#a855f7"
              fillOpacity={0.2}
              strokeWidth={2}
            />
            <Radar
              name="Confidence"
              dataKey="Confidence"
              stroke="#06b6d4"
              fill="#06b6d4"
              fillOpacity={0.2}
              strokeWidth={2}
            />
            <Legend />
            <Tooltip
              contentStyle={{
                backgroundColor: "#27272a",
                border: "1px solid #3f3f46",
                borderRadius: "8px",
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
