"use client";

import type { ClosedTrade } from "@/lib/tradeTracker";
import { getClosedTradesLast24h } from "@/lib/tradeTracker";

interface Props {
  closedTrades: ClosedTrade[];
  openTradesCount: number;
  onClear: () => void;
}

export function TradeResultsTable({
  closedTrades,
  openTradesCount,
  onClear,
}: Props) {
  const last24h = getClosedTradesLast24h(closedTrades);

  const byTimeframe = last24h.reduce(
    (acc, t) => {
      if (!acc[t.timeframe]) acc[t.timeframe] = { TP: 0, SL: 0, pnl: 0 };
      acc[t.timeframe][t.result]++;
      acc[t.timeframe].pnl += t.pnl;
      return acc;
    },
    {} as Record<string, { TP: number; SL: number; pnl: number }>
  );

  const tfOrder = ["5m", "10m", "15m", "30m", "45m", "1h"];
  const totalTP = last24h.filter((t) => t.result === "TP").length;
  const totalSL = last24h.filter((t) => t.result === "SL").length;
  const totalPnl = last24h.reduce((s, t) => s + t.pnl, 0);
  const winRate =
    totalTP + totalSL > 0
      ? ((totalTP / (totalTP + totalSL)) * 100).toFixed(1)
      : "—";

  return (
    <div className="rounded-xl border border-zinc-700/50 bg-zinc-900/50 p-5">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-sm font-semibold text-zinc-300">
          Évaluation modèle — TP/SL atteints (24h)
        </h3>
        <div className="flex items-center gap-2">
          <span className="rounded bg-zinc-700/50 px-2 py-0.5 text-xs text-zinc-400">
            {openTradesCount} en cours
          </span>
          <button
            onClick={async () => {
              try {
                await fetch("/api/trades", { method: "DELETE" });
                onClear();
              } catch {
                onClear();
              }
            }}
            className="rounded border border-zinc-600 bg-zinc-800 px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-700"
          >
            Réinitialiser
          </button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg bg-emerald-500/10 p-3">
          <p className="text-xs text-emerald-400">TP atteints</p>
          <p className="text-xl font-bold text-emerald-400">{totalTP}</p>
        </div>
        <div className="rounded-lg bg-rose-500/10 p-3">
          <p className="text-xs text-rose-400">SL atteints</p>
          <p className="text-xl font-bold text-rose-400">{totalSL}</p>
        </div>
        <div className="rounded-lg bg-cyan-500/10 p-3">
          <p className="text-xs text-cyan-400">Win rate</p>
          <p className="text-xl font-bold text-cyan-400">{winRate}%</p>
        </div>
        <div className="rounded-lg bg-amber-500/10 p-3">
          <p className="text-xs text-amber-400">P&L total ($)</p>
          <p
            className={`text-xl font-bold ${
              totalPnl >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {totalPnl >= 0 ? "+" : ""}
            {totalPnl.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-700 text-left text-zinc-500">
              <th className="py-2 pr-4">Timeframe</th>
              <th className="py-2 pr-4 text-center">TP</th>
              <th className="py-2 pr-4 text-center">SL</th>
              <th className="py-2 pr-4 text-right">P&L ($)</th>
            </tr>
          </thead>
          <tbody>
            {tfOrder.map((tf) => {
              const row = byTimeframe[tf] ?? { TP: 0, SL: 0, pnl: 0 };
              return (
                <tr
                  key={tf}
                  className="border-b border-zinc-800/50 text-zinc-300"
                >
                  <td className="py-2 pr-4 font-medium">{tf}</td>
                  <td className="py-2 pr-4 text-center text-emerald-400">
                    {row.TP}
                  </td>
                  <td className="py-2 pr-4 text-center text-rose-400">
                    {row.SL}
                  </td>
                  <td
                    className={`py-2 text-right ${
                      row.pnl >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {row.pnl >= 0 ? "+" : ""}
                    {row.pnl.toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {last24h.length > 0 && (
        <div className="mt-4 max-h-40 overflow-y-auto">
          <p className="mb-2 text-xs text-zinc-500">Derniers résultats</p>
          <div className="space-y-1 text-xs">
            {last24h
              .slice(-10)
              .reverse()
              .map((t, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-2 rounded bg-zinc-800/50 px-2 py-1"
                >
                  <span className="font-medium">
                    {t.timeframe} {t.signal} {t.result}
                  </span>
                  <span
                    className={
                      t.pnl >= 0 ? "text-emerald-400" : "text-rose-400"
                    }
                  >
                    {t.pnl >= 0 ? "+" : ""}
                    {t.pnl.toFixed(2)} $
                  </span>
                  <span className="text-zinc-500 text-[10px]">
                    {new Date(t.closeTime).toLocaleTimeString("fr-FR")}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      <p className="mt-3 text-xs text-zinc-500">
        Données persistées sur 7 jours. P&L estimé pour 1 lot (0.01 oz).
      </p>
    </div>
  );
}
