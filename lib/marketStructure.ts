import type { OHLCV } from "./types";

export interface MarketStructureResult {
  higherHigh: boolean;
  higherLow: boolean;
  lowerHigh: boolean;
  lowerLow: boolean;
  structure: string;
}

function getPivotHighs(data: OHLCV[], left = 3, right = 3): { i: number; v: number }[] {
  const pivots: { i: number; v: number }[] = [];
  for (let i = left; i < data.length - right; i++) {
    let isPivot = true;
    const h = data[i]!.high;
    for (let j = i - left; j <= i + right; j++) {
      if (j !== i && data[j]!.high >= h) {
        isPivot = false;
        break;
      }
    }
    if (isPivot) pivots.push({ i, v: h });
  }
  return pivots;
}

function getPivotLows(data: OHLCV[], left = 3, right = 3): { i: number; v: number }[] {
  const pivots: { i: number; v: number }[] = [];
  for (let i = left; i < data.length - right; i++) {
    let isPivot = true;
    const l = data[i]!.low;
    for (let j = i - left; j <= i + right; j++) {
      if (j !== i && data[j]!.low <= l) {
        isPivot = false;
        break;
      }
    }
    if (isPivot) pivots.push({ i, v: l });
  }
  return pivots;
}

export function analyzeMarketStructure(data: OHLCV[]): MarketStructureResult {
  const highs = getPivotHighs(data);
  const lows = getPivotLows(data);

  if (highs.length < 2 || lows.length < 2) {
    return {
      higherHigh: false,
      higherLow: false,
      lowerHigh: false,
      lowerLow: false,
      structure: "Forming",
    };
  }

  const h1 = highs[highs.length - 2]!.v;
  const h2 = highs[highs.length - 1]!.v;
  const l1 = lows[lows.length - 2]!.v;
  const l2 = lows[lows.length - 1]!.v;

  const higherHigh = h2 > h1;
  const higherLow = l2 > l1;
  const lowerHigh = h2 < h1;
  const lowerLow = l2 < l1;

  let structure = "Sideways";
  if (higherHigh && higherLow) structure = "Bullish (HH + HL)";
  else if (lowerHigh && lowerLow) structure = "Bearish (LH + LL)";
  else if (higherHigh && !higherLow) structure = "Potential Reversal Up";
  else if (lowerLow && !lowerHigh) structure = "Potential Reversal Down";

  return {
    higherHigh,
    higherLow,
    lowerHigh,
    lowerLow,
    structure,
  };
}
