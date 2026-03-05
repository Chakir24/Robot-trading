-- Table pour le suivi des trades (évaluation TP/SL)
CREATE TABLE IF NOT EXISTS trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL CHECK (status IN ('open', 'closed')),
  timeframe TEXT NOT NULL,
  signal TEXT NOT NULL CHECK (signal IN ('Buy', 'Sell')),
  entry DOUBLE PRECISION NOT NULL,
  sl DOUBLE PRECISION NOT NULL,
  tp DOUBLE PRECISION NOT NULL,
  open_time BIGINT NOT NULL,
  close_price DOUBLE PRECISION,
  close_time BIGINT,
  result TEXT CHECK (result IN ('TP', 'SL')),
  pnl DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);
CREATE INDEX IF NOT EXISTS idx_trades_close_time ON trades(close_time) WHERE status = 'closed';

-- RLS désactivé pour l'anon key (dashboard public)
-- Pour sécuriser : activez RLS et créez des policies
