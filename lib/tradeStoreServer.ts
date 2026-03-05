import path from "path";
import fs from "fs";
import type { OpenTrade, ClosedTrade } from "./tradeTracker";
import {
  isSupabaseConfigured,
  loadTradeDataSupabase,
  closeTradeSupabase,
  saveOpenTradesSupabase,
  clearTradeDataSupabase,
} from "./tradeStoreSupabase";

const MAX_STORAGE_DAYS = 7;
const HOURS_24 = 24 * 60 * 60 * 1000;

// Fichier (fallback)
const IS_VERCEL = process.env.VERCEL === "1";
const DATA_DIR = IS_VERCEL ? "/tmp/trad3" : path.join(process.cwd(), "data");
const TRADES_FILE = path.join(DATA_DIR, "trades.json");

function loadTradeDataFile(): {
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

function saveTradeDataFile(
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

function clearTradeDataFile(): void {
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

export async function loadTradeDataServer(): Promise<{
  openTrades: Record<string, OpenTrade>;
  closedTrades: ClosedTrade[];
}> {
  if (isSupabaseConfigured()) {
    return loadTradeDataSupabase();
  }
  return loadTradeDataFile();
}

export async function saveTradeDataServer(
  openTrades: Record<string, OpenTrade>,
  closedTrades: ClosedTrade[]
): Promise<void> {
  if (isSupabaseConfigured()) {
    await saveOpenTradesSupabase(openTrades);
    return;
  }
  saveTradeDataFile(openTrades, closedTrades);
}

export async function closeTradeServer(
  id: string,
  closePrice: number,
  result: "TP" | "SL",
  pnl: number
): Promise<void> {
  if (isSupabaseConfigured()) {
    await closeTradeSupabase(id, closePrice, result, pnl);
  }
}

export async function clearTradeDataServer(): Promise<void> {
  if (isSupabaseConfigured()) {
    await clearTradeDataSupabase();
    return;
  }
  clearTradeDataFile();
}
