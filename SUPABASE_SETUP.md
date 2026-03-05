# Configuration Supabase

## 1. Créer un projet Supabase

1. Allez sur [supabase.com](https://supabase.com) et créez un compte
2. **New Project** → nommez le projet (ex: `trad3`)
3. Choisissez un mot de passe pour la base de données
4. Attendez la création du projet

## 2. Créer la table `trades`

Dans le dashboard Supabase : **SQL Editor** → **New query** → collez et exécutez :

```sql
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

CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);
CREATE INDEX IF NOT EXISTS idx_trades_close_time ON trades(close_time) WHERE status = 'closed';
```

## 3. Récupérer les clés API

1. **Project Settings** (icône engrenage) → **API**
2. Copiez :
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** (sous Project API keys) → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 4. Configurer les variables d'environnement

**En local** : créez `.env.local` à la racine du projet :

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Sur Vercel** : **Project Settings** → **Environment Variables** → ajoutez les deux variables.

## 5. Comportement

- **Avec Supabase** : les données d'évaluation TP/SL sont stockées de façon persistante
- **Sans Supabase** : fallback sur fichier local (`data/trades.json`) ou `/tmp` sur Vercel (éphémère)
