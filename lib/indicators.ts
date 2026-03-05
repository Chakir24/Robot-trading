import type { OHLCV } from "./types";

export function calculateRSI(closes: number[], period = 14): number {
  if (closes.length < period + 1) return 50;
  const gains: number[] = [];
  const losses: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    const change = closes[i]! - closes[i - 1]!;
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }
  const avgGain =
    gains.slice(-period).reduce((a, b) => a + b, 0) / period;
  const avgLoss =
    losses.slice(-period).reduce((a, b) => a + b, 0) / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return Math.round((100 - 100 / (1 + rs)) * 100) / 100;
}

export function calculateMACD(
  closes: number[],
  fast = 12,
  slow = 26,
  signal = 9
): { value: number; signal: number; histogram: number } {
  const ema = (arr: number[], period: number): number => {
    if (arr.length < period) return arr[arr.length - 1] ?? 0;
    const k = 2 / (period + 1);
    let val = arr.slice(0, period).reduce((a, b) => a + b, 0) / period;
    for (let i = period; i < arr.length; i++) {
      val = (arr[i]! - val) * k + val;
    }
    return val;
  };
  if (closes.length < slow + 5) {
    return { value: 0, signal: 0, histogram: 0 };
  }
  const macdValues: number[] = [];
  for (let i = slow; i <= closes.length; i++) {
    const slice = closes.slice(0, i);
    macdValues.push(ema(slice, fast) - ema(slice, slow));
  }
  const macdLine = macdValues[macdValues.length - 1] ?? 0;
  const signalLine =
    macdValues.length >= signal
      ? ema(macdValues, signal)
      : macdLine;
  return {
    value: Math.round(macdLine * 100) / 100,
    signal: Math.round(signalLine * 100) / 100,
    histogram: Math.round((macdLine - signalLine) * 100) / 100,
  };
}

export function getVolumeAnalysis(
  data: OHLCV[],
  lookback = 20
): { current: number; average: number; relative: string } {
  const vols = data.map((d) => d.volume).filter((v) => v > 0);
  const current = vols[vols.length - 1] ?? 0;
  const slice = vols.slice(-lookback);
  const avg = slice.length ? slice.reduce((a, b) => a + b, 0) / slice.length : 0;
  let relative = "Normal";
  if (avg > 0) {
    const ratio = current / avg;
    if (ratio > 1.5) relative = "High";
    else if (ratio < 0.5) relative = "Low";
  }
  return {
    current: Math.round(current * 100) / 100,
    average: Math.round(avg * 100) / 100,
    relative,
  };
}
