//+------------------------------------------------------------------+
//|                                    XAUUSD_ElliottWave_EA.mq5     |
//|                    Robot basé sur Elliott Wave + RSI + MACD      |
//|                    Inspiré du modèle trad3                        |
//+------------------------------------------------------------------+
#property copyright "trad3"
#property link      ""
#property version   "1.00"
#property strict

#include <Trade\Trade.mqh>
#include <Trade\PositionInfo.mqh>

//+------------------------------------------------------------------+
//| INPUT PARAMETERS                                                  |
//+------------------------------------------------------------------+
input group "=== Gestion du risque (compte 200 CAD) ==="
input double   InpLotSize        = 0.01;      // Taille du lot (min pour petit compte)
input double   InpRiskPercent   = 0.5;        // Risque % du capital (0.5% = 1 CAD sur 200)
input double   InpRRRatio        = 3.5;       // Ratio Risk:Reward (1:X)
input double   InpATRMultiplier  = 1.5;       // Multiplicateur ATR pour Stop Loss
input double   InpMinBalance     = 100;       // Solde minimum (CAD) - arrêt si en dessous
input int      InpMaxDailyTrades = 2;         // Max trades par jour (préserver capital)
input double   InpMaxDailyLossPct= 5.0;       // Max perte quotidienne % - arrêt si dépassé

input group "=== Indicateurs ==="
input int      InpRSIPeriod      = 14;        // Période RSI
input int      InpRSIOversold    = 30;        // RSI Survente
input int      InpRSIOverbought  = 70;        // RSI Surchauffe
input int      InpMACDFast       = 12;       // MACD Fast
input int      InpMACDSlow       = 26;       // MACD Slow
input int      InpMACDSignal     = 9;        // MACD Signal
input int      InpATRPeriod      = 14;       // Période ATR

input group "=== Structure de marché ==="
input int      InpSwingLookback  = 5;        // Lookback pour swing High/Low
input int      InpFibLookback    = 30;       // Lookback pour Fibonacci

input group "=== Filtres ==="
input bool     InpUseWave3C      = true;     // Exiger setup Wave 3 / Wave C
input bool     InpUseFibTarget   = true;     // Utiliser Fib pour TP ambitieux
input int      InpMinProbability = 50;      // Score probabilité minimum (0-100)

input group "=== Timeframe & Symbol ==="
input ENUM_TIMEFRAMES InpTimeframe = PERIOD_H1;  // Timeframe d'analyse
input int      InpMagicNumber    = 123456;   // Magic Number
input int      InpMaxSpread     = 50;       // Spread max (points, 0=ignoré)

//+------------------------------------------------------------------+
//| GLOBAL VARIABLES                                                  |
//+------------------------------------------------------------------+
CTrade         trade;
CPositionInfo  posInfo;
int            handleRSI, handleMACD, handleATR;
datetime       lastBarTime = 0;
datetime       lastTradeDay = 0;
int            dailyTradesCount = 0;
double         dailyStartBalance = 0;

//+------------------------------------------------------------------+
//| Expert initialization function                                    |
//+------------------------------------------------------------------+
int OnInit()
{
   trade.SetExpertMagicNumber(InpMagicNumber);
   trade.SetDeviationInPoints(10);
   trade.SetTypeFilling(ORDER_FILLING_IOC);

   handleRSI  = iRSI(_Symbol, InpTimeframe, InpRSIPeriod, PRICE_CLOSE);
   handleMACD = iMACD(_Symbol, InpTimeframe, InpMACDFast, InpMACDSlow, InpMACDSignal, PRICE_CLOSE);
   handleATR  = iATR(_Symbol, InpTimeframe, InpATRPeriod);

   if(handleRSI == INVALID_HANDLE || handleMACD == INVALID_HANDLE || handleATR == INVALID_HANDLE)
   {
      Print("Erreur création indicateurs");
      return INIT_FAILED;
   }

   return INIT_SUCCEEDED;
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                  |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   if(handleRSI != INVALID_HANDLE)  IndicatorRelease(handleRSI);
   if(handleMACD != INVALID_HANDLE) IndicatorRelease(handleMACD);
   if(handleATR != INVALID_HANDLE)  IndicatorRelease(handleATR);
}

//+------------------------------------------------------------------+
//| Expert tick function                                              |
//+------------------------------------------------------------------+
void OnTick()
{
   if(!IsNewBar()) return;
   if(HasOpenPosition()) return;

   // Vérifications pour compte 200 CAD
   double balance = AccountInfoDouble(ACCOUNT_BALANCE);
   if(balance < InpMinBalance)
   {
      return;  // Solde trop bas, ne pas trader
   }

   if(InpMaxSpread > 0 && SymbolInfoInteger(_Symbol, SYMBOL_SPREAD) > InpMaxSpread)
      return;

   // Réinitialiser compteur quotidien à minuit
   datetime todayStart = iTime(_Symbol, PERIOD_D1, 0);
   if(lastTradeDay != todayStart)
   {
      lastTradeDay = todayStart;
      dailyTradesCount = 0;
      dailyStartBalance = balance;
   }

   // Limite trades par jour
   if(dailyTradesCount >= InpMaxDailyTrades) return;

   // Limite perte quotidienne
   if(InpMaxDailyLossPct > 0 && dailyStartBalance > 0)
   {
      double dailyLossPct = (dailyStartBalance - balance) / dailyStartBalance * 100;
      if(dailyLossPct >= InpMaxDailyLossPct) return;
   }

   int signal = GetSignal();
   if(signal == 0) return;

   double sl = 0, tp = 0;
   double lot = CalcLotSize();

   if(signal == 1)  // BUY
   {
      CalcLevelsBuy(sl, tp);
      if(sl > 0 && tp > 0 && lot > 0)
      {
         if(trade.Buy(lot, _Symbol, 0, sl, tp, "EW_EA_Buy"))
            dailyTradesCount++;
      }
   }
   else if(signal == -1)  // SELL
   {
      CalcLevelsSell(sl, tp);
      if(sl > 0 && tp > 0 && lot > 0)
      {
         if(trade.Sell(lot, _Symbol, 0, sl, tp, "EW_EA_Sell"))
            dailyTradesCount++;
      }
   }
}

//+------------------------------------------------------------------+
//| Vérifie si nouvelle barre                                         |
//+------------------------------------------------------------------+
bool IsNewBar()
{
   datetime t = iTime(_Symbol, InpTimeframe, 0);
   if(t != lastBarTime) { lastBarTime = t; return true; }
   return false;
}

//+------------------------------------------------------------------+
//| Position ouverte ?                                                |
//+------------------------------------------------------------------+
bool HasOpenPosition()
{
   for(int i = PositionsTotal() - 1; i >= 0; i--)
      if(posInfo.SelectByIndex(i) && posInfo.Symbol() == _Symbol && posInfo.Magic() == InpMagicNumber)
         return true;
   return false;
}

//+------------------------------------------------------------------+
//| Calcule le lot selon le risque (adapté compte 200 CAD)            |
//+------------------------------------------------------------------+
double CalcLotSize()
{
   double balance = AccountInfoDouble(ACCOUNT_BALANCE);
   double minLot = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
   double maxLot = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MAX);
   double stepLot = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_STEP);

   // Mode lot fixe pour petit compte (RiskPercent=0)
   if(InpRiskPercent <= 0)
   {
      return MathMax(minLot, MathMin(maxLot, NormalizeDouble(InpLotSize, 2)));
   }

   double riskAmount = balance * InpRiskPercent / 100.0;
   double tickValue = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_VALUE);
   double tickSize  = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_SIZE);
   double point    = SymbolInfoDouble(_Symbol, SYMBOL_POINT);

   if(tickValue <= 0 || tickSize <= 0) return InpLotSize;

   double atr = GetATR();
   double slDist = atr * InpATRMultiplier;
   double slPoints = slDist / point;
   double moneyPerLot = (slPoints * point / tickSize) * tickValue;

   if(moneyPerLot <= 0) return InpLotSize;

   double lot = riskAmount / moneyPerLot;
   lot = MathFloor(lot / stepLot) * stepLot;

   // Compte < 500 CAD : plafonner à 0.01 pour limiter le risque
   if(balance < 500 && lot > 0.01)
      lot = 0.01;

   lot = MathMax(minLot, MathMin(maxLot, lot));

   return NormalizeDouble(lot, 2);
}

//+------------------------------------------------------------------+
//| Obtient le signal (1=Buy, -1=Sell, 0=Wait)                        |
//+------------------------------------------------------------------+
int GetSignal()
{
   double rsi = GetRSI();
   double macdMain[], macdSignal[], macdHist[];
   ArraySetAsSeries(macdMain, true);
   ArraySetAsSeries(macdSignal, true);
   ArraySetAsSeries(macdHist, true);

   if(CopyBuffer(handleMACD, 0, 0, 3, macdMain) < 3) return 0;
   if(CopyBuffer(handleMACD, 1, 0, 3, macdSignal) < 3) return 0;
   if(CopyBuffer(handleMACD, 2, 0, 3, macdHist) < 3) return 0;

   double macdHistVal = macdMain[0] - macdSignal[0];

   // Structure de marché (HH, HL, LH, LL)
   bool higherHigh = false, higherLow = false, lowerHigh = false, lowerLow = false;
   GetMarketStructure(higherHigh, higherLow, lowerHigh, lowerLow);

   // Tendance
   int trend = 0;  // 1=bullish, -1=bearish
   if(higherHigh && higherLow) trend = 1;
   else if(lowerHigh && lowerLow) trend = -1;
   else if(macdHistVal > 0) trend = 1;
   else if(macdHistVal < 0) trend = -1;

   // Détection Wave 3 / Wave C
   bool wave3Setup = (trend == 1) && (rsi > 50 && rsi < 70) && (macdHistVal > 0);
   bool waveCSetup = (trend == -1) && (rsi < 50 && rsi > 30) && (macdHistVal < 0);

   if(InpUseWave3C && !wave3Setup && !waveCSetup) return 0;

   // Score probabilité simplifié
   int score = 50;
   if(trend == 1 && higherHigh) score += 10;
   if(trend == -1 && lowerLow) score += 10;
   if(rsi >= 30 && rsi <= 70) score += 5;
   if(wave3Setup || waveCSetup) score += 15;
   if(score < InpMinProbability) return 0;

   // Signal BUY
   if(trend == 1)
   {
      if(rsi > InpRSIOverbought) return 0;
      if(rsi < InpRSIOversold || (rsi < 50 && macdHistVal > 0)) return 1;
      if(macdHistVal > 0) return 1;
   }

   // Signal SELL
   if(trend == -1)
   {
      if(rsi < InpRSIOversold) return 0;
      if(rsi > InpRSIOverbought || (rsi > 50 && macdHistVal < 0)) return -1;
      if(macdHistVal < 0) return -1;
   }

   return 0;
}

//+------------------------------------------------------------------+
//| Structure de marché (swing highs/lows)                            |
//+------------------------------------------------------------------+
void GetMarketStructure(bool &hh, bool &hl, bool &lh, bool &ll)
{
   double high[], low[];
   ArraySetAsSeries(high, true);
   ArraySetAsSeries(low, true);
   int bars = InpSwingLookback * 4 + 10;

   if(CopyHigh(_Symbol, InpTimeframe, 0, bars, high) < bars) return;
   if(CopyLow(_Symbol, InpTimeframe, 0, bars, low) < bars) return;

   int sh1 = -1, sh2 = -1, sl1 = -1, sl2 = -1;
   int lb = InpSwingLookback;

   for(int i = lb; i < bars - lb; i++)
   {
      bool isSwingHigh = true, isSwingLow = true;
      for(int j = i - lb; j <= i + lb; j++)
      {
         if(j == i) continue;
         if(high[j] >= high[i]) isSwingHigh = false;
         if(low[j] <= low[i]) isSwingLow = false;
      }
      if(isSwingHigh) { sh2 = sh1; sh1 = i; }
      if(isSwingLow)  { sl2 = sl1; sl1 = i; }
   }

   if(sh1 >= 0 && sh2 >= 0)
   {
      hh = high[sh1] > high[sh2];
      lh = high[sh1] < high[sh2];
   }
   if(sl1 >= 0 && sl2 >= 0)
   {
      hl = low[sl1] > low[sl2];
      ll = low[sl1] < low[sl2];
   }
}

//+------------------------------------------------------------------+
//| RSI                                                               |
//+------------------------------------------------------------------+
double GetRSI()
{
   double buf[];
   ArraySetAsSeries(buf, true);
   if(CopyBuffer(handleRSI, 0, 0, 1, buf) < 1) return 50;
   return buf[0];
}

//+------------------------------------------------------------------+
//| ATR                                                               |
//+------------------------------------------------------------------+
double GetATR()
{
   double buf[];
   ArraySetAsSeries(buf, true);
   if(CopyBuffer(handleATR, 0, 0, 1, buf) < 1) return 0;
   return buf[0];
}

//+------------------------------------------------------------------+
//| Fibonacci - Swing High/Low                                         |
//+------------------------------------------------------------------+
void GetFibLevels(double &swingHigh, double &swingLow)
{
   double high[], low[];
   ArraySetAsSeries(high, true);
   ArraySetAsSeries(low, true);
   int bars = InpFibLookback;

   if(CopyHigh(_Symbol, InpTimeframe, 0, bars, high) < bars) return;
   if(CopyLow(_Symbol, InpTimeframe, 0, bars, low) < bars) return;

   swingHigh = high[ArrayMaximum(high, 0, bars)];
   swingLow  = low[ArrayMinimum(low, 0, bars)];
}

//+------------------------------------------------------------------+
//| Calcule SL et TP pour BUY                                         |
//+------------------------------------------------------------------+
void CalcLevelsBuy(double &sl, double &tp)
{
   double price = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
   double atr = GetATR();
   if(atr <= 0) atr = price * 0.005;

   double slDist = atr * InpATRMultiplier;
   double tpDist = slDist * InpRRRatio;

   sl = NormalizeDouble(price - slDist, _Digits);
   double baseTP = NormalizeDouble(price + tpDist, _Digits);

   if(InpUseFibTarget)
   {
      double sh = 0, slo = 0;
      GetFibLevels(sh, slo);
      double range = sh - slo;
      if(range > 0)
      {
         double fib161 = sh + range * 0.618;
         double fib200 = sh + range;
         if(fib161 > baseTP) baseTP = fib161;
         if(fib200 > baseTP) baseTP = fib200;
      }
   }

   tp = NormalizeDouble(baseTP, _Digits);

   double point = SymbolInfoDouble(_Symbol, SYMBOL_POINT);
   if(sl >= price - point) sl = 0;
   if(tp <= price + point) tp = 0;
}

//+------------------------------------------------------------------+
//| Calcule SL et TP pour SELL                                        |
//+------------------------------------------------------------------+
void CalcLevelsSell(double &sl, double &tp)
{
   double price = SymbolInfoDouble(_Symbol, SYMBOL_BID);
   double atr = GetATR();
   if(atr <= 0) atr = price * 0.005;

   double slDist = atr * InpATRMultiplier;
   double tpDist = slDist * InpRRRatio;

   sl = NormalizeDouble(price + slDist, _Digits);
   double baseTP = NormalizeDouble(price - tpDist, _Digits);

   if(InpUseFibTarget)
   {
      double sh = 0, slo = 0;
      GetFibLevels(sh, slo);
      double range = sh - slo;
      if(range > 0)
      {
         double fib618 = sh - range * 0.618;
         double fib786 = sh - range * 0.786;
         if(fib786 < price && fib786 > 0 && fib786 < baseTP) baseTP = fib786;
         else if(fib618 < price && fib618 > 0 && fib618 < baseTP) baseTP = fib618;
      }
   }

   tp = NormalizeDouble(baseTP, _Digits);

   double point = SymbolInfoDouble(_Symbol, SYMBOL_POINT);
   if(sl <= price + point) sl = 0;
   if(tp >= price - point) tp = 0;
}
