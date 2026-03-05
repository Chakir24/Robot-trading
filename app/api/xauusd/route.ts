import { NextResponse } from "next/server";
import { fetchAllTimeframes } from "@/lib/marketData";
import { buildFullAnalysis } from "@/lib/analysisEngine";
import { processTradeCheckServer } from "@/lib/tradeTrackerServer";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rrParam = searchParams.get("rr");
    const rrTarget = rrParam ? Math.min(5, Math.max(1.5, parseFloat(rrParam) || 3.5)) : 3.5;

    const timeframeData = await fetchAllTimeframes();
    const analysis = buildFullAnalysis(timeframeData, rrTarget);

    const { openTrades, closedTrades } = processTradeCheckServer(
      analysis.timeframes,
      analysis.currentPrice
    );

    return NextResponse.json(
      {
        ...analysis,
        tradeResults: {
          openTrades,
          closedTrades,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("XAUUSD analysis error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch or analyze XAUUSD data",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
