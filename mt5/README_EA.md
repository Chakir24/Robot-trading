# XAUUSD Elliott Wave EA - MetaTrader 5

Robot de trading pour MT5 inspiré du modèle trad3 (Elliott Wave + RSI + MACD + Structure de marché).

## Installation

1. Copier `XAUUSD_ElliottWave_EA.mq5` dans le dossier :
   ```
   C:\Users\[VotreNom]\AppData\Roaming\MetaQuotes\Terminal\[ID]\MQL5\Experts\
   ```

2. Ouvrir MetaTrader 5 → Outils → Options → Expert Advisors :
   - Cocher "Autoriser le trading automatique"

3. Dans le Navigateur (Ctrl+N), ouvrir **Expert Advisors**
4. Glisser-déposer l'EA sur le graphique XAUUSD (ou autre symbole)

## Paramètres

### Gestion du risque (optimisé compte 200 CAD)
| Paramètre | Défaut | Description |
|-----------|--------|-------------|
| Lot Size | 0.01 | Taille fixe du lot (si RiskPercent=0) |
| Risk Percent | 0.5 | Risque % du capital (0.5% = 1 CAD sur 200 CAD) |
| RR Ratio | 3.5 | Ratio Risk:Reward (1:3.5 = gain 3.5x le risque) |
| ATR Multiplier | 1.5 | Multiplicateur ATR pour Stop Loss |
| Min Balance | 100 | Solde minimum (CAD) - arrêt si en dessous |
| Max Daily Trades | 2 | Max trades par jour (préserver capital) |
| Max Daily Loss % | 5.0 | Max perte quotidienne % - arrêt si dépassé |

### Indicateurs
| Paramètre | Défaut | Description |
|-----------|--------|-------------|
| RSI Period | 14 | Période RSI |
| RSI Oversold | 30 | Niveau survente |
| RSI Overbought | 70 | Niveau surchauffe |
| MACD Fast/Slow/Signal | 12/26/9 | Paramètres MACD |
| ATR Period | 14 | Période ATR |

### Structure de marché
| Paramètre | Défaut | Description |
|-----------|--------|-------------|
| Swing Lookback | 5 | Barres pour détecter swing High/Low |
| Fib Lookback | 30 | Barres pour calcul Fibonacci |

### Filtres
| Paramètre | Défaut | Description |
|-----------|--------|-------------|
| Use Wave 3/C | true | Exiger setup Wave 3 (bullish) ou Wave C (bearish) |
| Use Fib Target | true | Utiliser extensions Fib pour TP ambitieux |
| Min Probability | 50 | Score confluence minimum (0-100) |
| Max Spread | 50 | Spread max en points (0 = ignoré) |

### Timeframe
| Paramètre | Défaut | Description |
|-----------|--------|-------------|
| Timeframe | H1 | Timeframe d'analyse (M5, M15, M30, H1, H4) |

## Logique de trading

### Signal BUY
- Structure : Higher High + Higher Low (tendance haussière)
- RSI : < 70 (pas de surchauffe), idéalement 50-70 ou rebond sur 30
- MACD : Histogramme > 0
- Optionnel : Setup Wave 3 (RSI 50-70, MACD positif, momentum haussier)

### Signal SELL
- Structure : Lower High + Lower Low (tendance baissière)
- RSI : > 30 (pas de survente), idéalement 30-50 ou rejet sur 70
- MACD : Histogramme < 0
- Optionnel : Setup Wave C (RSI 30-50, MACD négatif, momentum baissier)

### Stop Loss & Take Profit
- **SL** : ATR × Multiplicateur (défaut 1.5)
- **TP** : SL × R:R (défaut 3.5)
- **TP Fib** (si activé) : Extensions 161.8% ou 200% (Buy) / Retracements 61.8% ou 78.6% (Sell)

## Configuration pour compte 200 CAD

Paramètres par défaut adaptés :
- **Risk** : 0.5% = 1 CAD par trade
- **Lot** : 0.01 (plafonné si compte < 500 CAD)
- **Min Balance** : 100 CAD (arrêt si solde insuffisant)
- **Max 2 trades/jour** : éviter le surtrading
- **Max 5% perte/jour** : protection du capital

Pour lot fixe uniquement : mettre Risk Percent = 0.

## Recommandations

- **Backtest** sur données historiques avant utilisation en réel
- **XAUUSD** : spread variable, vérifier Max Spread
- **Compte démo** : tester d'abord en démo
- **Timeframe** : H1 ou H4 pour moins de bruit, M15/M30 pour plus de trades

## Avertissement

Ce robot est fourni à titre éducatif. Le trading comporte des risques. Les performances passées ne garantissent pas les résultats futurs.
