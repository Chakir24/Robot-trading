"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  Legend,
} from "recharts";
import type { TimeframeAnalysis } from "@/lib/types";

interface Props {
  timeframes: Record<string, TimeframeAnalysis>;
  lotSize?: number;
}

interface PnLData {
  timeframe: string;
  signal: string;
  entryMid: number;
  gain: number; // $ si TP atteint
  loss: number; // $ si SL atteint (valeur positive, affichée en négatif)
  gainFormatted: string;
  lossFormatted: string;
  rr: number;
}

function computePnL(tf: TimeframeAnalysis, lotSize: number): PnLData {
  const entryMid = (tf.entryPriceZone.min + tf.entryPriceZone.max) / 2;

  if (tf.entrySignal === "Buy") {
    const gain = (tf.takeProfit - entryMid) * lotSize;
    const loss = (entryMid - tf.stopLoss) * lotSize;
    return {
      timeframe: tf.timeframe,
      signal: "Buy",
      entryMid,
      gain: Math.round(gain * 100) / 100,
      loss: Math.round(loss * 100) / 100,
      gainFormatted: `+$${gain.toFixed(2)}`,
      lossFormatted: `-$${loss.toFixed(2)}`,
      rr: tf.riskRewardRatio,
    };
  }

  if (tf.entrySignal === "Sell") {
    const gain = (entryMid - tf.takeProfit) * lotSize;
    const loss = (tf.stopLoss - entryMid) * lotSize;
    return {
      timeframe: tf.timeframe,
      signal: "Sell",
      entryMid,
      gain: Math.round(gain * 100) / 100,
      loss: Math.round(loss * 100) / 100,
      gainFormatted: `+$${gain.toFixed(2)}`,
      lossFormatted: `-$${loss.toFixed(2)}`,
      rr: tf.riskRewardRatio,
    };
  }

  return {
    timeframe: tf.timeframe,
    signal: "Wait",
    entryMid,
    gain: 0,
    loss: 0,
    gainFormatted: "—",
    lossFormatted: "—",
    rr: 0,
  };
}

export function PnLChart({ timeframes }: Props) {
  const [lotSize, setLotSize] = useState(1);
  const tfOrder = ["5m", "10m", "15m", "30m", "45m", "1h"];
  const rawData = tfOrder
    .filter((tf) => timeframes[tf])
    .map((tf) => computePnL(timeframes[tf], lotSize));

  // Pour le graphique : loss en négatif pour afficher à gauche
  const data = rawData.map((d) => ({
    ...d,
    gain: d.gain,
    loss: d.loss > 0 ? -d.loss : 0,
  }));

  const maxGain = Math.max(...data.map((d) => d.gain), 1);
  const maxLoss = Math.max(...data.map((d) => Math.abs(d.loss)), 1);
  const yMax = Math.max(maxGain, maxLoss) * 1.2;

  return (
    <div className="rounded-xl border border-zinc-700/50 bg-zinc-900/50 p-5">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-sm font-semibold text-zinc-300">
          Gain / Perte potentiel par timeframe
        </h3>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-zinc-500">
            Lot (oz):
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={lotSize}
              onChange={(e) => setLotSize(Math.max(0.01, parseFloat(e.target.value) || 1))}
              className="w-20 rounded border border-zinc-600 bg-zinc-800 px-2 py-1 text-zinc-200"
            />
          </label>
          <span className="text-xs text-zinc-500">Entry = milieu zone</span>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
          >
            <XAxis
              type="number"
              domain={[-yMax, yMax]}
              tick={{ fill: "#71717a", fontSize: 10 }}
              tickFormatter={(v) => `${v >= 0 ? "" : "-"}$${Math.abs(v).toFixed(0)}`}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="timeframe"
              width={50}
              tick={{ fill: "#a1a1aa", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <ReferenceLine x={0} stroke="#52525b" strokeWidth={1} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#27272a",
                border: "1px solid #3f3f46",
                borderRadius: "8px",
              }}
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null;
                const p = payload[0].payload as PnLData;
                return (
                  <div className="space-y-1 rounded-lg border border-zinc-600 bg-zinc-800 p-3 text-xs">
                    <p>
                      <span className="text-zinc-500">Signal:</span>{" "}
                      <span className="font-medium">{p.signal}</span>
                    </p>
                    <p>
                      <span className="text-zinc-500">Entry (milieu):</span> $
                      {p.entryMid.toFixed(2)}
                    </p>
                    <p>
                      <span className="text-emerald-400">Gain si TP:</span>{" "}
                      {p.gainFormatted}
                    </p>
                    <p>
                      <span className="text-rose-400">Perte si SL:</span>{" "}
                      {p.lossFormatted}
                    </p>
                    <p>
                      <span className="text-zinc-500">R:R:</span> {p.rr}
                    </p>
                  </div>
                );
              }}
              cursor={{ fill: "rgba(63, 63, 70, 0.3)" }}
            />
            <Legend
              wrapperStyle={{ fontSize: "11px" }}
              formatter={(value) => (
                <span className="text-zinc-400">{value}</span>
              )}
            />
            <Bar
              dataKey="gain"
              name="Gain (TP atteint)"
              fill="#10b981"
              radius={[0, 4, 4, 0]}
              maxBarSize={24}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`gain-${index}`}
                  fill={entry.signal === "Wait" ? "#52525b" : "#10b981"}
                />
              ))}
            </Bar>
            <Bar
              dataKey="loss"
              name="Perte (SL atteint)"
              fill="#f43f5e"
              radius={[4, 0, 0, 4]}
              maxBarSize={24}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`loss-${index}`}
                  fill={entry.signal === "Wait" ? "#52525b" : "#f43f5e"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-3 text-xs text-zinc-500">
        Barres vertes = gain potentiel si Take Profit atteint • Barres rouges =
        perte potentielle si Stop Loss atteint • Pour lot = 1 oz
      </p>
    </div>
  );
}
