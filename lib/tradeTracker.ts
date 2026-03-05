export interface OpenTrade {
  timeframe: string;
  signal: "Buy" | "Sell";
  entry: number;
  sl: number;
  tp: number;
  openTime: number;
  id?: string; // Pour Supabase
}

export interface ClosedTrade {
  timeframe: string;
  result: "TP" | "SL";
  signal: "Buy" | "Sell";
  entry: number;
  sl: number;
  tp: number;
  closePrice: number;
  openTime: number;
  closeTime: number;
  pnl: number;
}

const STORAGE_KEY = "trad3_trade_results";
const HOURS_24 = 24 * 60 * 60 * 1000;

export function loadTradeData(): {
  openTrades: Record<string, OpenTrade>;
  closedTrades: ClosedTrade[];
} {
  if (typeof window === "undefined")
    return { openTrades: {}, closedTrades: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { openTrades: {}, closedTrades: [] };
    const parsed = JSON.parse(raw);
    return {
      openTrades: parsed.openTrades ?? {},
      closedTrades: parsed.closedTrades ?? [],
    };
  } catch {
    return { openTrades: {}, closedTrades: [] };
  }
}

const MAX_STORAGE_DAYS = 7;

export function saveTradeData(
  openTrades: Record<string, OpenTrade>,
  closedTrades: ClosedTrade[]
): void {
  if (typeof window === "undefined") return;
  try {
    const cutoff = Date.now() - MAX_STORAGE_DAYS * HOURS_24;
    const trimmed = closedTrades.filter((t) => t.closeTime >= cutoff);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ openTrades, closedTrades: trimmed })
    );
  } catch {}
}

export function clearTradeData(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export function getClosedTradesLast24h(closedTrades: ClosedTrade[]): ClosedTrade[] {
  const cutoff = Date.now() - HOURS_24;
  return closedTrades.filter((t) => t.closeTime >= cutoff);
}

export function processTradeCheck(
  timeframes: Record<string, { entrySignal: string; entryPriceZone: { min: number; max: number }; stopLoss: number; takeProfit: number }>,
  currentPrice: number
): {
  openTrades: Record<string, OpenTrade>;
  closedTrades: ClosedTrade[];
  newResults: ClosedTrade[];
} {
  const { openTrades, closedTrades } = loadTradeData();
  const updatedOpen: Record<string, OpenTrade> = { ...openTrades };
  const updatedClosed = [...closedTrades];
  const newResults: ClosedTrade[] = [];

  // Vérifier les trades ouverts
  for (const [tf, trade] of Object.entries(updatedOpen)) {
    const hit = checkTradeHit(trade, currentPrice);
    if (hit) {
      const closed: ClosedTrade = {
        timeframe: tf,
        result: hit.result,
        signal: trade.signal,
        entry: trade.entry,
        sl: trade.sl,
        tp: trade.tp,
        closePrice: currentPrice,
        openTime: trade.openTime,
        closeTime: Date.now(),
        pnl: hit.pnl,
      };
      updatedClosed.push(closed);
      newResults.push(closed);
      delete updatedOpen[tf];
    }
  }

  // Ouvrir de nouveaux trades pour les signaux Buy/Sell sans trade ouvert
  for (const [tf, data] of Object.entries(timeframes)) {
    if (data.entrySignal !== "Buy" && data.entrySignal !== "Sell") continue;
    if (updatedOpen[tf]) continue;

    const entry = (data.entryPriceZone.min + data.entryPriceZone.max) / 2;
    const openTrade: OpenTrade = {
      timeframe: tf,
      signal: data.entrySignal as "Buy" | "Sell",
      entry,
      sl: data.stopLoss,
      tp: data.takeProfit,
      openTime: Date.now(),
    };
    updatedOpen[tf] = openTrade;
  }

  saveTradeData(updatedOpen, updatedClosed);
  return { openTrades: updatedOpen, closedTrades: updatedClosed, newResults };
}

function checkTradeHit(
  trade: OpenTrade,
  price: number
): { result: "TP" | "SL"; pnl: number } | null {
  if (trade.signal === "Buy") {
    if (price >= trade.tp)
      return { result: "TP", pnl: trade.tp - trade.entry };
    if (price <= trade.sl)
      return { result: "SL", pnl: trade.entry - trade.sl };
  } else {
    if (price <= trade.tp)
      return { result: "TP", pnl: trade.entry - trade.tp };
    if (price >= trade.sl)
      return { result: "SL", pnl: trade.sl - trade.entry };
  }
  return null;
}
