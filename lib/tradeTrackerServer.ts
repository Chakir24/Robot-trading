import type { OpenTrade, ClosedTrade } from "./tradeTracker";
import {
  loadTradeDataServer,
  saveTradeDataServer,
} from "./tradeStoreServer";

export type { OpenTrade, ClosedTrade } from "./tradeTracker";

export function processTradeCheckServer(
  timeframes: Record<
    string,
    {
      entrySignal: string;
      entryPriceZone: { min: number; max: number };
      stopLoss: number;
      takeProfit: number;
    }
  >,
  currentPrice: number
): {
  openTrades: Record<string, OpenTrade>;
  closedTrades: ClosedTrade[];
} {
  const { openTrades, closedTrades } = loadTradeDataServer();
  const updatedOpen: Record<string, OpenTrade> = { ...openTrades };
  const updatedClosed = [...closedTrades];

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
      delete updatedOpen[tf];
    }
  }

  for (const [tf, data] of Object.entries(timeframes)) {
    if (data.entrySignal !== "Buy" && data.entrySignal !== "Sell") continue;
    if (updatedOpen[tf]) continue;

    const entry = (data.entryPriceZone.min + data.entryPriceZone.max) / 2;
    updatedOpen[tf] = {
      timeframe: tf,
      signal: data.entrySignal as "Buy" | "Sell",
      entry,
      sl: data.stopLoss,
      tp: data.takeProfit,
      openTime: Date.now(),
    };
  }

  saveTradeDataServer(updatedOpen, updatedClosed);
  return { openTrades: updatedOpen, closedTrades: updatedClosed };
}

function checkTradeHit(
  trade: OpenTrade,
  price: number
): { result: "TP" | "SL"; pnl: number } | null {
  if (trade.signal === "Buy") {
    if (price >= trade.tp) return { result: "TP", pnl: trade.tp - trade.entry };
    if (price <= trade.sl) return { result: "SL", pnl: trade.entry - trade.sl };
  } else {
    if (price <= trade.tp) return { result: "TP", pnl: trade.entry - trade.tp };
    if (price >= trade.sl) return { result: "SL", pnl: trade.sl - trade.entry };
  }
  return null;
}
