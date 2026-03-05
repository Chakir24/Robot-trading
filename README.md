# XAUUSD Elliott Wave Analyzer

Real-time XAUUSD (Gold) technical analysis using Elliott Wave Theory, Fibonacci, RSI, MACD, and volume analysis. Built for Next.js dashboard integration.

## Features

- **Multi-timeframe analysis**: 5m, 10m, 15m, 30m, 45m, 1h
- **Elliott Wave**: Impulse & Corrective structure detection
- **Fibonacci**: Retracement (23.6%, 38.2%, 50%, 61.8%, 78.6%) and extension (127.2%, 161.8%, 200%, 261.8%)
- **Indicators**: RSI (14), MACD (12,26,9), Volume analysis
- **Market structure**: Higher High, Higher Low, Lower High, Lower Low
- **Trade signals**: Entry zones, Stop Loss, Take Profit, Risk-Reward ratio
- **Wave 3 / Wave C setup detection**
- **Breakout & reversal probability**

## Data Source

Uses Yahoo Finance (GC=F Gold Futures) for OHLCV data. No API key required.

## Quick Start

```bash
npm install
npm run dev
```

- **Dashboard**: http://localhost:3000
- **API (JSON)**: http://localhost:3000/api/xauusd

## Stockage Supabase

Pour une évaluation TP/SL persistante (Vercel, 24/7), configurez Supabase :

1. Créez un projet sur [supabase.com](https://supabase.com)
2. Exécutez le SQL dans `supabase/migrations/001_create_trades.sql`
3. Ajoutez `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` dans `.env.local` (ou Vercel)

Voir `SUPABASE_SETUP.md` pour le guide complet.

## Déploiement Vercel

Le projet est prêt pour Vercel. Connectez votre dépôt GitHub sur [vercel.com](https://vercel.com) → **Import** → déployez. Ajoutez les variables Supabase dans les paramètres du projet. Voir `DEPLOY.md`.

## API Response Structure

```json
{
  "symbol": "XAUUSD",
  "analysisTimestamp": "ISO8601",
  "currentPrice": 5394.00,
  "timeframes": {
    "5m": { /* TimeframeAnalysis */ },
    "10m": { /* ... */ },
    "15m": { /* ... */ },
    "30m": { /* ... */ },
    "45m": { /* ... */ },
    "1h": { /* ... */ }
  },
  "oscillationProjection": { "direction", "targetZone", "confidence" },
  "wave3SetupDetected": true,
  "waveCSetupDetected": false,
  "breakoutProbability": 51.67,
  "reversalProbability": 52.67
}
```

## Évaluation 24/7 (serveur)

Le suivi TP/SL est stocké côté serveur (`data/trades.json`). Pour une évaluation en continu :

1. **Héberger le site** sur un VPS ou serveur persistant
2. **Configurer un cron externe** pour appeler l'API toutes les 5 secondes :
   - URL : `https://votre-site.com/api/cron`
   - Ou utiliser le worker : `node scripts/cron-worker.js https://votre-site.com`
   - Avec PM2 : `pm2 start scripts/cron-worker.js --name trad3-cron`

L'endpoint `/api/cron` effectue l'analyse et met à jour le suivi TP/SL.

## Robot MT5 (Expert Advisor)

Un robot de trading pour MetaTrader 5 est disponible dans le dossier `mt5/` :

- **Fichier** : `mt5/XAUUSD_ElliottWave_EA.mq5`
- **Documentation** : `mt5/README_EA.md`

Le robot intègre la même logique (Elliott Wave, RSI, MACD, Fibonacci, structure de marché) avec des paramètres configurables (R:R, ATR, filtres Wave 3/C, etc.).

## Disclaimer

This is for educational and research purposes only. Not financial advice. Always do your own analysis and risk management.
