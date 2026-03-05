"use client";

interface Props {
  retracement: Record<string, number>;
  extension: Record<string, number>;
  currentPrice: number;
}

export function FibonacciChart({ retracement, extension, currentPrice }: Props) {
  const levels = [
    ...Object.entries(extension).reverse(),
    ...Object.entries(retracement),
  ];
  const min = Math.min(...Object.values(retracement), currentPrice) - 20;
  const max = Math.max(...Object.values(extension), currentPrice) + 20;
  const range = max - min;

  const toY = (price: number) =>
    ((max - price) / range) * 100;

  return (
    <div className="rounded-xl border border-zinc-700/50 bg-zinc-900/50 p-5">
      <h3 className="mb-4 text-sm font-semibold text-zinc-300">
        Fibonacci Levels
      </h3>
      <div className="relative h-64">
        {levels.map(([label, price]) => (
          <div
            key={label}
            className="absolute left-0 right-0 flex items-center"
            style={{ top: `${toY(price)}%` }}
          >
            <div
              className={`h-px flex-1 ${
                label === "0%" || label === "100%"
                  ? "bg-zinc-500"
                  : "bg-zinc-600/60"
              }`}
            />
            <span className="ml-2 w-16 text-right text-xs text-zinc-400">
              {label}
            </span>
            <span className="ml-2 w-20 text-right text-xs font-medium text-zinc-300">
              ${price.toFixed(2)}
            </span>
          </div>
        ))}
        <div
          className="absolute left-0 right-0 h-0.5 bg-amber-400"
          style={{ top: `${toY(currentPrice)}%` }}
        >
          <span className="absolute -top-5 left-0 text-xs font-bold text-amber-400">
            ${currentPrice.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
