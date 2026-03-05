"use client";

interface Props {
  currentPrice: number;
  timestamp: string;
  wave3: boolean;
  waveC: boolean;
  breakoutProb: number;
  reversalProb: number;
  oscillation: {
    direction: string;
    targetZone: { min: number; max: number };
    confidence: number;
  };
}

export function OverviewCards({
  currentPrice,
  timestamp,
  wave3,
  waveC,
  breakoutProb,
  reversalProb,
  oscillation,
}: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-amber-900/10 p-5">
        <p className="mb-1 text-xs font-medium uppercase tracking-wider text-amber-400">
          XAUUSD Price
        </p>
        <p className="text-3xl font-bold text-zinc-100">
          ${currentPrice.toFixed(2)}
        </p>
        <p className="mt-2 text-xs text-zinc-500">
          {new Date(timestamp).toLocaleString()}
        </p>
      </div>

      <div className="rounded-xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-cyan-900/10 p-5">
        <p className="mb-1 text-xs font-medium uppercase tracking-wider text-cyan-400">
          Projection
        </p>
        <p className="text-xl font-bold text-zinc-100">{oscillation.direction}</p>
        <p className="mt-1 text-sm text-zinc-400">
          ${oscillation.targetZone.min.toFixed(2)} - $
          {oscillation.targetZone.max.toFixed(2)}
        </p>
        <p className="mt-2 text-xs text-zinc-500">
          Confidence: {oscillation.confidence}%
        </p>
      </div>

      <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-emerald-900/10 p-5">
        <p className="mb-1 text-xs font-medium uppercase tracking-wider text-emerald-400">
          Wave Setups
        </p>
        <div className="flex gap-3">
          <div>
            <p className="text-xs text-zinc-500">Wave 3</p>
            <p className={`font-bold ${wave3 ? "text-emerald-400" : "text-zinc-600"}`}>
              {wave3 ? "Detected" : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Wave C</p>
            <p className={`font-bold ${waveC ? "text-rose-400" : "text-zinc-600"}`}>
              {waveC ? "Detected" : "—"}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 to-violet-900/10 p-5">
        <p className="mb-1 text-xs font-medium uppercase tracking-wider text-violet-400">
          Probabilities
        </p>
        <div className="space-y-2">
          <div>
            <div className="mb-0.5 flex justify-between text-xs">
              <span className="text-zinc-500">Breakout</span>
              <span className="text-zinc-300">{breakoutProb}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full bg-violet-500"
                style={{ width: `${breakoutProb}%` }}
              />
            </div>
          </div>
          <div>
            <div className="mb-0.5 flex justify-between text-xs">
              <span className="text-zinc-500">Reversal</span>
              <span className="text-zinc-300">{reversalProb}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full bg-fuchsia-500"
                style={{ width: `${reversalProb}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
