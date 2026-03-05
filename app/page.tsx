"use client";

import { useEffect, useState, useCallback } from "react";
import type { XAUUSDAnalysisResponse } from "@/lib/types";
import { OverviewCards } from "@/components/OverviewCards";
import { TimeframeCard } from "@/components/TimeframeCard";
import { FibonacciChart } from "@/components/FibonacciChart";
import { SignalsChart } from "@/components/SignalsChart";
import { IndicatorsRadar } from "@/components/IndicatorsRadar";
import { PnLChart } from "@/components/PnLChart";
import { PriceLevelsChart } from "@/components/PriceLevelsChart";
import { TradeResultsTable } from "@/components/TradeResultsTable";
import type { ClosedTrade } from "@/lib/tradeTracker";

const REFRESH_INTERVAL_MS = 5000; // 5 secondes

export default function Home() {
  const [data, setData] = useState<XAUUSDAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL_MS / 1000);
  const [rrTarget, setRrTarget] = useState(3.5);
  const [tradeState, setTradeState] = useState<{
    openTrades: Record<string, unknown>;
    closedTrades: ClosedTrade[];
  }>({ openTrades: {}, closedTrades: [] });

  const fetchData = useCallback((isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setRefreshing(true);

    fetch(`/api/xauusd?rr=${rrTarget}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.error) throw new Error(json.message);
        setData(json);
        setLastUpdate(new Date());
        setError(null);
        setCountdown(REFRESH_INTERVAL_MS / 1000);

        if (json.tradeResults) {
          setTradeState({
            openTrades: json.tradeResults.openTrades ?? {},
            closedTrades: json.tradeResults.closedTrades ?? [],
          });
        }
      })
      .catch((err) => {
        if (!isBackground) setError(err.message);
        // En arrière-plan : garder les données existantes, pas d'erreur affichée
      })
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }, [rrTarget]);

  useEffect(() => {
    fetchData(false);
    const interval = setInterval(() => fetchData(true), REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchData, rrTarget]);

  useEffect(() => {
    if (!data) return;
    const timer = setInterval(() => {
      setCountdown((c) => (c <= 1 ? REFRESH_INTERVAL_MS / 1000 : c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [data, lastUpdate]);

  if (loading && !data)
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-amber-500 border-t-transparent mx-auto" />
          <p className="text-zinc-400">Chargement de l&apos;analyse XAUUSD...</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="rounded-xl border border-rose-500/50 bg-rose-500/10 p-8 text-center">
          <p className="text-rose-400 font-semibold">Erreur</p>
          <p className="mt-2 text-zinc-400">{error}</p>
          <button
            onClick={() => fetchData(false)}
            className="mt-4 rounded-lg bg-rose-500/20 px-4 py-2 text-sm text-rose-400 hover:bg-rose-500/30"
          >
            Réessayer
          </button>
        </div>
      </div>
    );

  if (!data) return null;

  const tfOrder = ["5m", "10m", "15m", "30m", "45m", "1h"];
  const radarData = Object.fromEntries(
    tfOrder
      .filter((tf) => data.timeframes[tf])
      .map((tf) => [
        tf,
        {
          rsi: data.timeframes[tf].indicators.rsi,
          macdHistogram: data.timeframes[tf].indicators.macd.histogram,
          probabilityScore: data.timeframes[tf].probabilityScore,
        },
      ])
  );

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="border-b border-zinc-800/50 bg-zinc-900/30 px-6 py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-zinc-100">
                {data.symbol} Elliott Wave Dashboard
              </h1>
              <span
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  refreshing
                    ? "bg-amber-500/20 text-amber-400"
                    : "bg-emerald-500/20 text-emerald-400"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    refreshing ? "animate-pulse bg-amber-400" : "bg-emerald-400"
                  }`}
                />
                {refreshing ? "Mise à jour..." : "Temps réel"}
              </span>
            </div>
            <p className="mt-1 flex items-center gap-3 text-sm text-zinc-500">
              <span>Analyse technique multi-timeframe • RSI • MACD • Fibonacci</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">
                Dernière MAJ : {lastUpdate?.toLocaleTimeString("fr-FR")} • Prochaine dans {countdown}s
              </span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-zinc-500">
              R:R (gain):
              <select
                value={rrTarget}
                onChange={(e) => {
                  setRrTarget(parseFloat(e.target.value));
                  fetchData(true);
                }}
                className="rounded border border-zinc-600 bg-zinc-800 px-2 py-1.5 text-zinc-200"
              >
                <option value={2}>1:2</option>
                <option value={2.5}>1:2.5</option>
                <option value={3}>1:3</option>
                <option value={3.5}>1:3.5 (recommandé)</option>
                <option value={4}>1:4</option>
                <option value={5}>1:5</option>
              </select>
            </label>
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-400 hover:bg-amber-500/20 disabled:opacity-50"
            >
              {refreshing ? "Actualisation..." : "Actualiser"}
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-8">
          <OverviewCards
            currentPrice={data.currentPrice}
            timestamp={data.analysisTimestamp}
            wave3={data.wave3SetupDetected}
            waveC={data.waveCSetupDetected}
            breakoutProb={data.breakoutProbability}
            reversalProb={data.reversalProbability}
            oscillation={{
              direction: data.oscillationProjection.direction,
              targetZone: data.oscillationProjection.targetZone,
              confidence: data.oscillationProjection.confidence,
            }}
          />
        </div>

        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          <SignalsChart timeframes={data.timeframes} />
          <IndicatorsRadar timeframes={radarData} />
        </div>

        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          <PnLChart timeframes={data.timeframes} />
          <PriceLevelsChart
            timeframes={data.timeframes}
            currentPrice={data.currentPrice}
          />
        </div>

        <div className="mb-8">
          <TradeResultsTable
            closedTrades={tradeState.closedTrades}
            openTradesCount={Object.keys(tradeState.openTrades).length}
            onClear={() => {
              setTradeState({ openTrades: {}, closedTrades: [] });
              fetchData(true);
            }}
          />
        </div>

        <div className="mb-8">
          <FibonacciChart
            retracement={data.timeframes["1h"]?.fibonacci.retracement ?? {}}
            extension={data.timeframes["1h"]?.fibonacci.extension ?? {}}
            currentPrice={data.currentPrice}
          />
        </div>

        <div>
          <h2 className="mb-4 text-lg font-semibold text-zinc-300">
            Analyse par Timeframe
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tfOrder.map((tf) =>
              data.timeframes[tf] ? (
                <TimeframeCard key={tf} data={data.timeframes[tf]} />
              ) : null
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
