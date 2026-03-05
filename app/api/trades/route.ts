import { NextResponse } from "next/server";
import { loadTradeDataServer, clearTradeDataServer } from "@/lib/tradeStoreServer";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function GET() {
  try {
    const { openTrades, closedTrades } = await loadTradeDataServer();
    return NextResponse.json({ openTrades, closedTrades });
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    await clearTradeDataServer();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
