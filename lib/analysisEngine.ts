import type { OHLCV } from "./types";
import type {
  TimeframeAnalysis,
  OscillationProjection,
  XAUUSDAnalysisResponse,
} from "./types";
import { calculateRSI, calculateMACD, getVolumeAnalysis } from "./indicators";
import { analyzeElliottWave, detectWave3Setup, detectWaveCSetup } from "./elliottWave";
import { calculateFibonacci } from "./fibonacci";
import { analyzeMarketStructure } from "./marketStructure";

const ATR_MULTIPLIER = 1.5;
const RR_TARGET_DEFAULT = 3.5; // Objectif gain plus élevé (1:3.5 au lieu de 1:2)

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function deriveEntrySignal(
  trend: "Bullish" | "Bearish" | "Sideways",
  rsi: number,
  macdHist: number,
  structure: string
): "Buy" | "Sell" | "Wait" {
  if (trend === "Sideways") return "Wait";
  const rsiOversold = rsi < 30;
  const rsiOverbought = rsi > 70;
  const macdBullish = macdHist > 0;
  const macdBearish = macdHist < 0;

  if (trend === "Bullish") {
    if (rsiOversold || (rsi < 50 && macdBullish)) return "Buy";
    if (rsiOverbought) return "Wait";
    return macdBullish ? "Buy" : "Wait";
  }
  if (trend === "Bearish") {
    if (rsiOverbought || (rsi > 50 && macdBearish)) return "Sell";
    if (rsiOversold) return "Wait";
    return macdBearish ? "Sell" : "Wait";
  }
  return "Wait";
}

function deriveTrend(
  waveType: "Impulse" | "Corrective",
  wavePhase: string,
  structure: string,
  macdHist: number
): "Bullish" | "Bearish" | "Sideways" {
  if (structure.includes("Bullish") || (wavePhase === "Wave 3" && waveType === "Impulse"))
    return "Bullish";
  if (structure.includes("Bearish") || (wavePhase === "Wave C" && waveType === "Corrective"))
    return "Bearish";
  if (macdHist > 0) return "Bullish";
  if (macdHist < 0) return "Bearish";
  return "Sideways";
}

function calculateATR(data: OHLCV[], period = 14): number {
  if (data.length < period + 1) return 0;
  const tr: number[] = [];
  for (let i = 1; i < data.length; i++) {
    const h = data[i]!.high;
    const l = data[i]!.low;
    const pc = data[i - 1]!.close;
    tr.push(Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc)));
  }
  const atr = tr.slice(-period).reduce((a, b) => a + b, 0) / period;
  return round2(atr);
}

function computeProbability(
  trend: string,
  entrySignal: string,
  rsi: number,
  macdHist: number,
  structure: string,
  volumeRelative: string,
  waveConfidence: number
): number {
  let score = 50;
  if (entrySignal !== "Wait") score += 10;
  if (trend === "Bullish" && entrySignal === "Buy") score += 8;
  if (trend === "Bearish" && entrySignal === "Sell") score += 8;
  if (volumeRelative === "High") score += 5;
  if (structure.includes("HH") || structure.includes("HL")) score += 5;
  if (structure.includes("LH") || structure.includes("LL")) score += 5;
  if (rsi >= 30 && rsi <= 70) score += 3;
  score = score + (waveConfidence - 50) * 0.2;
  return Math.min(95, Math.max(35, Math.round(score)));
}

export function analyzeTimeframe(
  data: OHLCV[],
  currentPrice: number,
  timeframe: string,
  rrTarget: number = RR_TARGET_DEFAULT
): TimeframeAnalysis {
  const closes = data.map((d) => d.close);
  const rsi = calculateRSI(closes, 14);
  const macd = calculateMACD(closes, 12, 26, 9);
  const volume = getVolumeAnalysis(data, 20);
  const fib = calculateFibonacci(data, currentPrice);
  const structure = analyzeMarketStructure(data);
  const wave = analyzeElliottWave(data, currentPrice);
  const atr = calculateATR(data, 14);

  const trend = deriveTrend(
    wave.type,
    wave.phase,
    structure.structure,
    macd.histogram
  );
  const entrySignal = deriveEntrySignal(
    trend,
    rsi,
    macd.histogram,
    structure.structure
  );

  const probability = computeProbability(
    trend,
    entrySignal,
    rsi,
    macd.histogram,
    structure.structure,
    volume.relative,
    wave.confidence
  );

  const slDistance = atr * ATR_MULTIPLIER || (currentPrice * 0.005);
  let tpDistance = slDistance * rrTarget;

  // Utiliser les extensions Fibonacci pour des objectifs plus ambitieux si disponibles
  const fib161 = fib.extension["161.8%"];
  const fib200 = fib.extension["200%"];

  let entryZoneMin = currentPrice;
  let entryZoneMax = currentPrice;
  let stopLoss = currentPrice;
  let takeProfit = currentPrice;

  if (entrySignal === "Buy") {
    entryZoneMin = round2(currentPrice - atr * 0.3);
    entryZoneMax = round2(currentPrice + atr * 0.2);
    stopLoss = round2(currentPrice - slDistance);
    let baseTP = round2(currentPrice + tpDistance);
    // TP plus ambitieux : viser Fib 161.8% ou 200% si au-dessus du TP de base
    if (fib161 && fib161 > baseTP) baseTP = fib161;
    if (fib200 && fib200 > baseTP) baseTP = fib200;
    takeProfit = round2(baseTP);
  } else if (entrySignal === "Sell") {
    entryZoneMin = round2(currentPrice - atr * 0.2);
    entryZoneMax = round2(currentPrice + atr * 0.3);
    stopLoss = round2(currentPrice + slDistance);
    let baseTP = round2(currentPrice - tpDistance);
    // TP plus ambitieux : viser Fib 161.8% ou 200% (retracement) si en dessous
    const fib161Ret = fib.retracement["61.8%"];
    const fib786Ret = fib.retracement["78.6%"];
    if (fib161Ret && fib161Ret < baseTP) baseTP = fib161Ret;
    if (fib786Ret && fib786Ret < baseTP) baseTP = fib786Ret;
    takeProfit = round2(baseTP);
  } else {
    stopLoss = round2(currentPrice - slDistance);
    takeProfit = round2(currentPrice + tpDistance);
  }

  const risk = Math.abs(currentPrice - stopLoss);
  const reward = Math.abs(takeProfit - currentPrice);
  const rr = risk > 0 ? round2(reward / risk) : 0;

  const wave3Signal = detectWave3Setup(data, rsi, macd.histogram);
  const waveCSignal = detectWaveCSetup(data, rsi, macd.histogram);

  const breakoutProb = structure.higherHigh && structure.higherLow ? 65 : structure.lowerHigh && structure.lowerLow ? 65 : 45;
  const reversalProb = (rsi < 30 || rsi > 70) ? 58 : 42;

  return {
    timeframe,
    currentPrice: round2(currentPrice),
    currentWaveCount: wave.label,
    waveType: wave.type,
    trendDirection: trend,
    entrySignal,
    entryPriceZone: { min: entryZoneMin, max: entryZoneMax },
    stopLoss,
    takeProfit,
    riskRewardRatio: rr,
    probabilityScore: probability,
    indicators: {
      rsi: round2(rsi),
      macd: {
        value: macd.value,
        signal: macd.signal,
        histogram: macd.histogram,
      },
      volumeAnalysis: {
        current: volume.current,
        average: volume.average,
        relative: volume.relative,
      },
    },
    fibonacci: {
      retracement: fib.retracement,
      extension: fib.extension,
    },
    marketStructure: {
      higherHigh: structure.higherHigh,
      higherLow: structure.higherLow,
      lowerHigh: structure.lowerHigh,
      lowerLow: structure.lowerLow,
      structure: structure.structure,
    },
    wave3OrWaveCSignal: wave3Signal || waveCSignal,
    breakoutProbability: round2(breakoutProb),
    reversalProbability: round2(reversalProb),
  };
}

export function computeOscillationProjection(
  analyses: TimeframeAnalysis[],
  currentPrice: number
): OscillationProjection {
  const bullishCount = analyses.filter((a) => a.trendDirection === "Bullish").length;
  const bearishCount = analyses.filter((a) => a.trendDirection === "Bearish").length;
  const avgProb = analyses.reduce((s, a) => s + a.probabilityScore, 0) / analyses.length;

  let direction: "Bullish" | "Bearish" | "Neutral" = "Neutral";
  if (bullishCount > bearishCount + 1) direction = "Bullish";
  else if (bearishCount > bullishCount + 1) direction = "Bearish";

  const range = currentPrice * 0.02;
  let targetMin = currentPrice;
  let targetMax = currentPrice;
  if (direction === "Bullish") {
    targetMin = round2(currentPrice);
    targetMax = round2(currentPrice + range);
  } else if (direction === "Bearish") {
    targetMin = round2(currentPrice - range);
    targetMax = round2(currentPrice);
  }

  return {
    direction,
    targetZone: { min: targetMin, max: targetMax },
    timeframe: "Multi",
    confidence: round2(avgProb),
  };
}

export function buildFullAnalysis(
  timeframeData: Record<string, { data: OHLCV[]; currentPrice: number }>,
  rrTarget: number = RR_TARGET_DEFAULT
): XAUUSDAnalysisResponse {
  const analyses: TimeframeAnalysis[] = [];
  const timeframes: Record<string, TimeframeAnalysis> = {};
  const currentPrice =
    timeframeData["1h"]?.currentPrice ?? Object.values(timeframeData)[0]?.currentPrice ?? 0;

  for (const [tf, { data, currentPrice: cp }] of Object.entries(timeframeData)) {
    const analysis = analyzeTimeframe(data, cp, tf, rrTarget);
    analyses.push(analysis);
    timeframes[tf] = analysis;
  }

  const oscillation = computeOscillationProjection(analyses, currentPrice);
  const wave3Detected = analyses.some((a) => a.wave3OrWaveCSignal && a.waveType === "Impulse");
  const waveCDetected = analyses.some((a) => a.wave3OrWaveCSignal && a.waveType === "Corrective");
  const avgBreakout = analyses.reduce((s, a) => s + a.breakoutProbability, 0) / analyses.length;
  const avgReversal = analyses.reduce((s, a) => s + a.reversalProbability, 0) / analyses.length;

  return {
    symbol: "XAUUSD",
    analysisTimestamp: new Date().toISOString(),
    currentPrice: round2(currentPrice),
    timeframes,
    oscillationProjection: oscillation,
    wave3SetupDetected: wave3Detected,
    waveCSetupDetected: waveCDetected,
    breakoutProbability: round2(avgBreakout),
    reversalProbability: round2(avgReversal),
  };
}
