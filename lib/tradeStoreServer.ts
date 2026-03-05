import path from "path";
import fs from "fs";
import type { OpenTrade, ClosedTrade } from "./tradeTracker";

const DATA_DIR = path.join(process.cwd(), "data");
const TRADES_FILE = path.join(DATA_DIR, "trades.json");

export function loadTradeDataServer(): {
  openTrades: Record<string, OpenTrade>;
  closedTrades: ClosedTrade[];
} {
  try {
    if (!fs.existsSync(TRADES_FILE)) {
      return { openTrades: {}, closedTrades: [] };
    }
    const raw = fs.readFileSync(TRADES_FILE, "utf-8");
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
const HOURS_24 = 24 * 60 * 60 * 1000;

export function saveTradeDataServer(
  openTrades: Record<string, OpenTrade>,
  closedTrades: ClosedTrade[]
): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const cutoff = Date.now() - MAX_STORAGE_DAYS * HOURS_24;
    const trimmed = closedTrades.filter((t) => t.closeTime >= cutoff);
    fs.writeFileSync(
      TRADES_FILE,
      JSON.stringify({ openTrades, closedTrades: trimmed }, null, 0),
      "utf-8"
    );
  } catch (err) {
    console.error("tradeStoreServer save error:", err);
  }
}

export function clearTradeDataServer(): void {
  try {
    if (fs.existsSync(TRADES_FILE)) {
      fs.writeFileSync(
        TRADES_FILE,
        JSON.stringify({ openTrades: {}, closedTrades: [] }),
        "utf-8"
      );
    }
  } catch (err) {
    console.error("tradeStoreServer clear error:", err);
  }
}
