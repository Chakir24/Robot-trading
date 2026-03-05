export const metadata = {
  title: "XAUUSD Elliott Wave Analyzer",
  description: "Real-time XAUUSD technical analysis with Elliott Wave, Fibonacci, RSI, MACD",
};

import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
