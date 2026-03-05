export interface OHLCV {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TimeframeAnalysis {
  timeframe: string;
  currentPrice: number;
  currentWaveCount: string;
  waveType: "Impulse" | "Corrective";
  trendDirection: "Bullish" | "Bearish" | "Sideways";
  entrySignal: "Buy" | "Sell" | "Wait";
  entryPriceZone: { min: number; max: number };
  stopLoss: number;
  takeProfit: number;
  riskRewardRatio: number;
  probabilityScore: number;
  indicators: {
    rsi: number;
    macd: { value: number; signal: number; histogram: number };
    volumeAnalysis: { current: number; average: number; relative: string };
  };
  fibonacci: {
    retracement: Record<string, number>;
    extension: Record<string, number>;
  };
  marketStructure: {
    higherHigh: boolean;
    higherLow: boolean;
    lowerHigh: boolean;
    lowerLow: boolean;
    structure: string;
  };
  wave3OrWaveCSignal: boolean;
  breakoutProbability: number;
  reversalProbability: number;
}

export interface OscillationProjection {
  direction: "Bullish" | "Bearish" | "Neutral";
  targetZone: { min: number; max: number };
  timeframe: string;
  confidence: number;
}

export interface XAUUSDAnalysisResponse {
  symbol: string;
  analysisTimestamp: string;
  currentPrice: number;
  timeframes: Record<string, TimeframeAnalysis>;
  oscillationProjection: OscillationProjection;
  wave3SetupDetected: boolean;
  waveCSetupDetected: boolean;
  breakoutProbability: number;
  reversalProbability: number;
}
