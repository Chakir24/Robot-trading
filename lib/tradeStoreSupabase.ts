import { getSupabaseClient, isSupabaseConfigured } from "./supabaseServer";
import type { OpenTrade, ClosedTrade } from "./tradeTracker";

const MAX_STORAGE_DAYS = 7;
const HOURS_24 = 24 * 60 * 60 * 1000;

export async function loadTradeDataSupabase(): Promise<{
  openTrades: Record<string, OpenTrade>;
  closedTrades: ClosedTrade[];
}> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { openTrades: {}, closedTrades: [] };
  }

  try {
    const { data: openRows, error: openErr } = await supabase
      .from("trades")
      .select("id, timeframe, signal, entry, sl, tp, open_time")
      .eq("status", "open");

    if (openErr) {
      console.error("Supabase load open error:", openErr);
      return { openTrades: {}, closedTrades: [] };
    }

    const cutoff = Date.now() - MAX_STORAGE_DAYS * HOURS_24;
    const { data: closedRows, error: closedErr } = await supabase
      .from("trades")
      .select("timeframe, result, signal, entry, sl, tp, close_price, open_time, close_time, pnl")
      .eq("status", "closed")
      .gte("close_time", cutoff);

    if (closedErr) {
      console.error("Supabase load closed error:", closedErr);
      return { openTrades: {}, closedTrades: [] };
    }

    const openTrades: Record<string, OpenTrade> = {};
    for (const row of openRows ?? []) {
      openTrades[row.timeframe] = {
        timeframe: row.timeframe,
        signal: row.signal,
        entry: row.entry,
        sl: row.sl,
        tp: row.tp,
        openTime: row.open_time,
        id: row.id,
      };
    }

    const closedTrades: ClosedTrade[] = (closedRows ?? []).map((row) => ({
      timeframe: row.timeframe,
      result: row.result,
      signal: row.signal,
      entry: row.entry,
      sl: row.sl,
      tp: row.tp,
      closePrice: row.close_price,
      openTime: row.open_time,
      closeTime: row.close_time,
      pnl: row.pnl,
    }));

    return { openTrades, closedTrades };
  } catch (err) {
    console.error("Supabase load error:", err);
    return { openTrades: {}, closedTrades: [] };
  }
}

export async function closeTradeSupabase(
  id: string,
  closePrice: number,
  result: "TP" | "SL",
  pnl: number
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  await supabase
    .from("trades")
    .update({
      status: "closed",
      close_price: closePrice,
      close_time: Date.now(),
      result,
      pnl,
    })
    .eq("id", id);
}

export async function saveOpenTradesSupabase(
  openTrades: Record<string, OpenTrade>
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    const { data: existing } = await supabase
      .from("trades")
      .select("id, timeframe")
      .eq("status", "open");

    const existingByTf = new Map((existing ?? []).map((r) => [r.timeframe, r.id]));

    for (const [tf, trade] of Object.entries(openTrades)) {
      const row = {
        timeframe: tf,
        signal: trade.signal,
        entry: trade.entry,
        sl: trade.sl,
        tp: trade.tp,
        open_time: trade.openTime,
      };
      if (existingByTf.has(tf)) {
        await supabase.from("trades").update(row).eq("id", existingByTf.get(tf));
      } else {
        await supabase.from("trades").insert({ ...row, status: "open" });
      }
    }

    for (const [tf, id] of Array.from(existingByTf.entries())) {
      if (!openTrades[tf]) {
        await supabase.from("trades").delete().eq("id", id);
      }
    }

    const cutoff = Date.now() - MAX_STORAGE_DAYS * HOURS_24;
    await supabase.from("trades").delete().eq("status", "closed").lt("close_time", cutoff);
  } catch (err) {
    console.error("Supabase save error:", err);
  }
}

export async function clearTradeDataSupabase(): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  await supabase.from("trades").delete().neq("id", "00000000-0000-0000-0000-000000000000");
}

export { isSupabaseConfigured };
