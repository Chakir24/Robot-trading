import type { OHLCV } from "./types";

export interface WaveCount {
  label: string;
  type: "Impulse" | "Corrective";
  phase: string;
  confidence: number;
}

function findSwingHighs(data: OHLCV[], lookback = 5): number[] {
  const highs: number[] = [];
  for (let i = lookback; i < data.length - lookback; i++) {
    const h = data[i]!.high;
    let isHigh = true;
    for (let j = i - lookback; j <= i + lookback; j++) {
      if (j !== i && data[j]!.high >= h) {
        isHigh = false;
        break;
      }
    }
    if (isHigh) highs.push(h);
  }
  return highs;
}

function findSwingLows(data: OHLCV[], lookback = 5): number[] {
  const lows: number[] = [];
  for (let i = lookback; i < data.length - lookback; i++) {
    const l = data[i]!.low;
    let isLow = true;
    for (let j = i - lookback; j <= i + lookback; j++) {
      if (j !== i && data[j]!.low <= l) {
        isLow = false;
        break;
      }
    }
    if (isLow) lows.push(l);
  }
  return lows;
}

export function analyzeElliottWave(
  data: OHLCV[],
  currentPrice: number
): WaveCount {
  const closes = data.map((d) => d.close);
  const swingHighs = findSwingHighs(data);
  const swingLows = findSwingLows(data);

  if (swingHighs.length < 2 || swingLows.length < 2) {
    return {
      label: "Wave 1-2 (Forming)",
      type: "Impulse",
      phase: "Early",
      confidence: 45,
    };
  }

  const lastHigh = swingHighs[swingHighs.length - 1] ?? 0;
  const prevHigh = swingHighs[swingHighs.length - 2] ?? 0;
  const lastLow = swingLows[swingLows.length - 1] ?? 0;
  const prevLow = swingLows[swingLows.length - 2] ?? 0;

  const higherHigh = lastHigh > prevHigh;
  const higherLow = lastLow > prevLow;
  const lowerHigh = lastHigh < prevHigh;
  const lowerLow = lastLow < prevLow;

  const recentTrend =
    closes[closes.length - 1]! > closes[Math.max(0, closes.length - 20)]!
      ? "up"
      : "down";

  if (higherHigh && higherLow && recentTrend === "up") {
    return {
      label: "Wave 3 (Impulse)",
      type: "Impulse",
      phase: "Wave 3",
      confidence: 72,
    };
  }
  if (lowerHigh && lowerLow && recentTrend === "down") {
    return {
      label: "Wave C (Corrective)",
      type: "Corrective",
      phase: "Wave C",
      confidence: 68,
    };
  }
  if (higherHigh && !higherLow) {
    return {
      label: "Wave 2 (Corrective)",
      type: "Corrective",
      phase: "Wave 2",
      confidence: 58,
    };
  }
  if (lowerLow && !lowerHigh) {
    return {
      label: "Wave B (Corrective)",
      type: "Corrective",
      phase: "Wave B",
      confidence: 55,
    };
  }

  return {
    label: "Wave 4-5 / Wave A (Transition)",
    type: "Impulse",
    phase: "Transition",
    confidence: 48,
  };
}

export function detectWave3Setup(
  data: OHLCV[],
  rsi: number,
  macdHist: number
): boolean {
  const closes = data.map((d) => d.close);
  const recentUp = closes[closes.length - 1]! > closes[closes.length - 5]!;
  return recentUp && rsi > 50 && rsi < 70 && macdHist > 0;
}

export function detectWaveCSetup(
  data: OHLCV[],
  rsi: number,
  macdHist: number
): boolean {
  const closes = data.map((d) => d.close);
  const recentDown = closes[closes.length - 1]! < closes[closes.length - 5]!;
  return recentDown && rsi < 50 && rsi > 30 && macdHist < 0;
}
