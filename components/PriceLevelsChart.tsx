"use client";

import type { TimeframeAnalysis } from "@/lib/types";

interface Props {
  timeframes: Record<string, TimeframeAnalysis>;
  currentPrice: number;
}

export function PriceLevelsChart({ timeframes, currentPrice }: Props) {
  const tfOrder = ["5m", "10m", "15m", "30m", "45m", "1h"];
  const levels = tfOrder
    .filter((tf) => timeframes[tf] && timeframes[tf].entrySignal !== "Wait")
    .map((tf) => {
      const d = timeframes[tf];
      const min = Math.min(d.entryPriceZone.min, d.stopLoss, d.takeProfit);
      const max = Math.max(d.entryPriceZone.max, d.stopLoss, d.takeProfit);
      const range = max - min || 1;
      const toPct = (p: number) => ((p - min) / range) * 100;
      return {
        timeframe: tf,
        signal: d.entrySignal,
        entryMin: d.entryPriceZone.min,
        entryMax: d.entryPriceZone.max,
        sl: d.stopLoss,
        tp: d.takeProfit,
        entryMinPct: toPct(d.entryPriceZone.min),
        entryMaxPct: toPct(d.entryPriceZone.max),
        slPct: toPct(d.stopLoss),
        tpPct: toPct(d.takeProfit),
        pricePct: toPct(currentPrice),
        min,
        max,
      };
    });

  if (levels.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-700/50 bg-zinc-900/50 p-5">
        <h3 className="mb-4 text-sm font-semibold text-zinc-300">
          Niveaux de prix (Entry Zone, SL, TP)
        </h3>
        <p className="text-center text-sm text-zinc-500">
          Aucun signal Buy/Sell actif sur les timeframes
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-700/50 bg-zinc-900/50 p-5">
      <h3 className="mb-4 text-sm font-semibold text-zinc-300">
        Niveaux de prix par timeframe (Entry Zone, SL, TP)
      </h3>
      <div className="space-y-4">
        {levels.map((l) => (
          <div key={l.timeframe}>
            <div className="mb-1 flex justify-between text-xs">
              <span className="font-medium text-zinc-300">{l.timeframe}</span>
              <span
                className={
                  l.signal === "Buy"
                    ? "text-emerald-400"
                    : "text-rose-400"
                }
              >
                {l.signal}
              </span>
            </div>
            <div className="relative h-8 rounded bg-zinc-800/80">
              {/* Zone de prix (min-max) */}
              <div
                className="absolute top-0 h-full rounded bg-zinc-600/60"
                style={{
                  left: `${Math.min(l.entryMinPct, l.entryMaxPct)}%`,
                  width: `${Math.abs(l.entryMaxPct - l.entryMinPct)}%`,
                }}
              />
              {/* SL */}
              <div
                className="absolute top-0 h-full w-1 bg-rose-500"
                style={{ left: `${l.slPct}%` }}
                title={`SL: $${l.sl.toFixed(2)}`}
              />
              {/* TP */}
              <div
                className="absolute top-0 h-full w-1 bg-emerald-500"
                style={{ left: `${l.tpPct}%` }}
                title={`TP: $${l.tp.toFixed(2)}`}
              />
              {/* Prix actuel */}
              <div
                className="absolute top-0 h-full w-1 bg-amber-400"
                style={{ left: `${l.pricePct}%` }}
                title={`Prix: $${currentPrice.toFixed(2)}`}
              />
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-zinc-500">
              <span>${l.min.toFixed(0)}</span>
              <span className="text-rose-400">SL ${l.sl.toFixed(0)}</span>
              <span className="text-amber-400">Entry</span>
              <span className="text-emerald-400">TP ${l.tp.toFixed(0)}</span>
              <span>${l.max.toFixed(0)}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-zinc-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded bg-amber-400" /> Prix actuel
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded bg-zinc-500" /> Entry Zone
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded bg-rose-500" /> Stop Loss
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded bg-emerald-500" /> Take Profit
        </span>
      </div>
    </div>
  );
}
