#!/usr/bin/env node
/**
 * Worker pour évaluation 24/7
 * Appelle l'API toutes les 5 secondes pour mettre à jour le suivi TP/SL
 * Usage: node scripts/cron-worker.js [URL]
 * Exemple: node scripts/cron-worker.js http://localhost:3000
 * À lancer avec PM2: pm2 start scripts/cron-worker.js --name trad3-cron
 */

const INTERVAL_MS = 5000;
const BASE_URL = process.argv[2] || "http://localhost:3000";

async function tick() {
  try {
    const res = await fetch(`${BASE_URL}/api/cron`);
    const data = await res.json();
    if (data.ok) {
      const time = new Date().toISOString().slice(11, 19);
      console.log(`[${time}] OK | price=${data.price} | open=${data.openTrades} | closed24h=${data.closedTrades24h}`);
    } else {
      console.error("[ERROR]", data.error);
    }
  } catch (err) {
    console.error("[ERROR]", err.message);
  }
}

console.log(`Cron worker started | ${BASE_URL} | every ${INTERVAL_MS}ms`);
tick();
setInterval(tick, INTERVAL_MS);
