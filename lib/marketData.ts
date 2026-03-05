import type { OHLCV } from "./types";

const YAHOO_CHART_URL = "https://query1.finance.yahoo.com/v8/finance/chart/GC=F";

const INTERVAL_MAP: Record<string, { interval: string; range: string }> = {
  "5m": { interval: "5m", range: "5d" },
  "10m": { interval: "5m", range: "5d" },
  "15m": { interval: "15m", range: "5d" },
  "30m": { interval: "30m", range: "5d" },
  "45m": { interval: "15m", range: "5d" },
  "1h": { interval: "1h", range: "5d" },
};

function aggregateCandles(candles: OHLCV[], factor: number): OHLCV[] {
  if (factor <= 1) return candles;
  const result: OHLCV[] = [];
  for (let i = 0; i < candles.length; i += factor) {
    const slice = candles.slice(i, i + factor).filter((c) => c.close > 0);
    if (slice.length === 0) continue;
    result.push({
      timestamp: slice[0].timestamp,
      open: slice[0].open,
      high: Math.max(...slice.map((c) => c.high)),
      low: Math.min(...slice.map((c) => c.low)),
      close: slice[slice.length - 1].close,
      volume: slice.reduce((s, c) => s + c.volume, 0),
    });
  }
  return result;
}

export async function fetchOHLCV(
  timeframe: string
): Promise<{ data: OHLCV[]; currentPrice: number }> {
  const config = INTERVAL_MAP[timeframe];
  if (!config) throw new Error(`Unsupported timeframe: ${timeframe}`);

  const url = `${YAHOO_CHART_URL}?interval=${config.interval}&range=${config.range}`;
  const res = await fetch(url, {
    next: { revalidate: 60 },
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; XAUUSD-Analyzer/1.0)",
    },
  });
  const json = await res.json();

  const result = json?.chart?.result?.[0];
  if (!result) throw new Error("Invalid Yahoo Finance response");

  const quote = result.indicators?.quote?.[0];
  const timestamps = result.timestamp || [];
  const meta = result.meta || {};
  const currentPrice = meta.regularMarketPrice ?? 0;

  const data: OHLCV[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    const o = quote.open?.[i];
    const h = quote.high?.[i];
    const l = quote.low?.[i];
    const c = quote.close?.[i];
    const v = quote.volume?.[i] ?? 0;
    if (o != null && h != null && l != null && c != null) {
      data.push({
        timestamp: timestamps[i],
        open: o,
        high: h,
        low: l,
        close: c,
        volume: v,
      });
    }
  }

  let candles = data;
  if (timeframe === "10m") candles = aggregateCandles(data, 2);
  if (timeframe === "45m") candles = aggregateCandles(data, 3);

  return { data: candles, currentPrice };
}

export async function fetchAllTimeframes(): Promise<
  Record<string, { data: OHLCV[]; currentPrice: number }>
> {
  const timeframes = ["5m", "10m", "15m", "30m", "45m", "1h"];
  const results = await Promise.all(
    timeframes.map(async (tf) => ({ tf, ...(await fetchOHLCV(tf)) }))
  );
  return Object.fromEntries(results.map((r) => [r.tf, { data: r.data, currentPrice: r.currentPrice }]));
}
