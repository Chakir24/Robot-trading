import type { OHLCV } from "./types";

export interface FibonacciLevels {
  retracement: Record<string, number>;
  extension: Record<string, number>;
  swingHigh: number;
  swingLow: number;
}

function findRecentSwingHigh(data: OHLCV[], lookback = 30): number {
  let high = data[0]!.high;
  const start = Math.max(0, data.length - lookback);
  for (let i = start; i < data.length; i++) {
    if (data[i]!.high > high) high = data[i]!.high;
  }
  return high;
}

function findRecentSwingLow(data: OHLCV[], lookback = 30): number {
  let low = data[0]!.low;
  const start = Math.max(0, data.length - lookback);
  for (let i = start; i < data.length; i++) {
    if (data[i]!.low < low) low = data[i]!.low;
  }
  return low;
}

export function calculateFibonacci(
  data: OHLCV[],
  currentPrice: number
): FibonacciLevels {
  const swingHigh = findRecentSwingHigh(data);
  const swingLow = findRecentSwingLow(data);
  const range = swingHigh - swingLow;

  const round2 = (n: number) => Math.round(n * 100) / 100;
  const retracement: Record<string, number> = {
    "0%": round2(swingHigh),
    "23.6%": round2(swingHigh - range * 0.236),
    "38.2%": round2(swingHigh - range * 0.382),
    "50%": round2(swingHigh - range * 0.5),
    "61.8%": round2(swingHigh - range * 0.618),
    "78.6%": round2(swingHigh - range * 0.786),
    "100%": round2(swingLow),
  };

  const extension: Record<string, number> = {
    "127.2%": round2(swingHigh + range * 0.272),
    "161.8%": round2(swingHigh + range * 0.618),
    "200%": round2(swingHigh + range),
    "261.8%": round2(swingHigh + range * 1.618),
  };

  return { retracement, extension, swingHigh: round2(swingHigh), swingLow: round2(swingLow) };
}
