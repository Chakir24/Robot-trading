import { NextResponse } from "next/server";
import { fetchAllTimeframes } from "@/lib/marketData";
import { buildFullAnalysis } from "@/lib/analysisEngine";
import { processTradeCheckServer } from "@/lib/tradeTrackerServer";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function GET() {
  try {
    const timeframeData = await fetchAllTimeframes();
    const analysis = buildFullAnalysis(timeframeData, 3.5);
    const { openTrades, closedTrades } = processTradeCheckServer(
      analysis.timeframes,
      analysis.currentPrice
    );
    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      price: analysis.currentPrice,
      openTrades: Object.keys(openTrades).length,
      closedTrades24h: closedTrades.filter(
        (t) => t.closeTime >= Date.now() - 24 * 60 * 60 * 1000
      ).length,
    });
  } catch (error) {
    console.error("Cron check error:", error);
    return NextResponse.json(
      { ok: false, error: String(error) },
      { status: 500 }
    );
  }
}
