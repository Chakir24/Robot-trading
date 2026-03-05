"use client";

import type { TimeframeAnalysis } from "@/lib/types";

interface Props {
  data: TimeframeAnalysis;
}

export function TimeframeCard({ data }: Props) {
  const trendColors = {
    Bullish: "from-emerald-500/20 to-emerald-900/20 border-emerald-500/40",
    Bearish: "from-rose-500/20 to-rose-900/20 border-rose-500/40",
    Sideways: "from-amber-500/20 to-amber-900/20 border-amber-500/40",
  };
  const signalColors = {
    Buy: "bg-emerald-500 text-white",
    Sell: "bg-rose-500 text-white",
    Wait: "bg-zinc-600 text-zinc-300",
  };

  const rsiColor =
    data.indicators.rsi < 30
      ? "bg-emerald-500"
      : data.indicators.rsi > 70
        ? "bg-rose-500"
        : "bg-amber-500";

  return (
    <div
      className={`rounded-xl border bg-gradient-to-br p-5 ${trendColors[data.trendDirection]}`}
    >
      <div className="mb-4 flex items-center justify-between">
        <span className="text-lg font-bold text-zinc-100">{data.timeframe}</span>
        <span
          className={`rounded-lg px-3 py-1 text-sm font-semibold ${signalColors[data.entrySignal]}`}
        >
          {data.entrySignal}
        </span>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-zinc-500">Wave</p>
          <p className="font-medium text-zinc-200">{data.currentWaveCount}</p>
        </div>
        <div>
          <p className="text-zinc-500">Trend</p>
          <p className="font-medium text-zinc-200">{data.trendDirection}</p>
        </div>
      </div>

      <div className="mb-4">
        <div className="mb-1 flex justify-between text-xs">
          <span className="text-zinc-500">RSI ({data.indicators.rsi})</span>
          <span className="text-zinc-400">0 — 100</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
          <div
            className={`h-full ${rsiColor} transition-all`}
            style={{ width: `${Math.min(100, data.indicators.rsi)}%` }}
          />
        </div>
      </div>

      <div className="mb-4 space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-zinc-500">Entry Zone</span>
          <span className="text-zinc-300">
            {data.entryPriceZone.min.toFixed(2)} - {data.entryPriceZone.max.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Stop Loss</span>
          <span className="text-rose-400">{data.stopLoss.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Take Profit</span>
          <span className="text-emerald-400">{data.takeProfit.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">R:R</span>
          <span className="text-amber-400">{data.riskRewardRatio.toFixed(1)}</span>
        </div>
      </div>

      <div className="mb-2">
        <div className="mb-1 flex justify-between text-xs">
          <span className="text-zinc-500">Confidence</span>
          <span className="text-zinc-300">{data.probabilityScore}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full bg-cyan-500 transition-all"
            style={{ width: `${data.probabilityScore}%` }}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-1 text-[10px]">
        {data.marketStructure.higherHigh && (
          <span className="rounded bg-emerald-500/30 px-1.5 py-0.5">HH</span>
        )}
        {data.marketStructure.higherLow && (
          <span className="rounded bg-emerald-500/30 px-1.5 py-0.5">HL</span>
        )}
        {data.marketStructure.lowerHigh && (
          <span className="rounded bg-rose-500/30 px-1.5 py-0.5">LH</span>
        )}
        {data.marketStructure.lowerLow && (
          <span className="rounded bg-rose-500/30 px-1.5 py-0.5">LL</span>
        )}
        {data.wave3OrWaveCSignal && (
          <span className="rounded bg-amber-500/30 px-1.5 py-0.5">W3/C</span>
        )}
      </div>
    </div>
  );
}
