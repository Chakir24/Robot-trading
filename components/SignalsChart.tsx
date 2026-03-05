"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface TimeframeData {
  timeframe: string;
  signal: string;
  probability: number;
  trend: string;
}

interface Props {
  timeframes: Record<string, { entrySignal: string; probabilityScore: number; trendDirection: string }>;
}

export function SignalsChart({ timeframes }: Props) {
  const data: TimeframeData[] = Object.entries(timeframes).map(
    ([tf, d]) => ({
      timeframe: tf,
      signal: d.entrySignal,
      probability: d.probabilityScore,
      trend: d.trendDirection,
    })
  );

  const getColor = (d: TimeframeData) => {
    if (d.signal === "Buy") return "#10b981";
    if (d.signal === "Sell") return "#f43f5e";
    return "#71717a";
  };

  return (
    <div className="rounded-xl border border-zinc-700/50 bg-zinc-900/50 p-5">
      <h3 className="mb-4 text-sm font-semibold text-zinc-300">
        Signal Confidence by Timeframe
      </h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="timeframe"
              tick={{ fill: "#a1a1aa", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: "#71717a", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={30}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#27272a",
                border: "1px solid #3f3f46",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "#a1a1aa" }}
              formatter={(value: number, _name: string, props: { payload?: TimeframeData }) => [
                `${value}%`,
                props.payload ? `${props.payload.signal} | ${props.payload.trend}` : "",
              ]}
            />
            <Bar dataKey="probability" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(entry)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
