import fs from "node:fs";
import path from "node:path";

function loadDotEnvIfNeeded() {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;
  const raw = fs.readFileSync(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let val = trimmed.slice(idx + 1).trim();
    if (!key) continue;
    if (val.startsWith("\"") && val.endsWith("\"")) val = val.slice(1, -1);
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

loadDotEnvIfNeeded();

const MORALIS = process.env.MORALIS_API_KEY;

const FALLBACK_PERCENT = Number(process.env.SOLSCAN_HOLDERS_FALLBACK_PERCENT ?? "40");
const FALLBACK =
  Number.isFinite(FALLBACK_PERCENT) && FALLBACK_PERCENT >= 0 && FALLBACK_PERCENT <= 100
    ? Math.round(FALLBACK_PERCENT)
    : 40;

const SOL_MINT = "So11111111111111111111111111111111111111112";
const SOL_USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const ETH_USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

/** Smoke test mirror of `solana-holders.ts` URL + naive percent-sum (like production parsers). */
async function solscanTop10Smoke(mint) {
  const u = new URL("https://public-api.solscan.io/token/holders");
  u.searchParams.set("tokenAddress", mint);
  u.searchParams.set("limit", "10");

  const res = await fetch(u.href, { headers: { Accept: "application/json" }, cache: "no-store" });
  const txt = await res.text();
  let json;
  try {
    json = JSON.parse(txt);
  } catch {
    json = null;
  }

  let rows =
    json && typeof json === "object"
      ? Array.isArray(json)
        ? json
        : json.holders ||
          json.data ||
          json.result ||
          json.items ||
          []
      : [];

  if (!Array.isArray(rows)) rows = [];

  const sumPct = rows.slice(0, 10).reduce((acc, r) => {
    const keys = [
      "percentage",
      "percent",
      "pct",
      "share",
      "proportion",
      "holderPercent",
      "percent_total_supply",
      "percentHeld",
    ];
    for (const k of keys) {
      const v = typeof r[k] === "number" ? r[k] : Number.parseFloat(String(r[k] ?? ""));
      if (Number.isFinite(v) && v >= 0) {
        acc += v > 1 ? v : v * 100;
        break;
      }
    }
    return acc;
  }, 0);

  console.log("\n[Solscan holders smoke]", {
    mint,
    httpStatus: res.status,
    bodyPreview: txt.slice(0, 220),
    rowCount: rows.length,
    sumPctRounded: rows.length ? Math.round(Math.min(100, Math.max(0, sumPct))) : null,
    appWouldUseFallback: !res.ok || !rows.length || !Number.isFinite(sumPct),
    fallbackPercent: FALLBACK,
  });

  if (!res.ok || !rows.length || !Number.isFinite(sumPct)) return FALLBACK;
  return Math.round(Math.min(100, Math.max(0, sumPct)));
}

async function moralisTop10Percent(token, chain = "eth") {
  if (!MORALIS) return null;
  const url = `https://deep-index.moralis.io/api/v2.2/erc20/${token}/owners?chain=${chain}&order=DESC&limit=10`;

  const res = await fetch(url, {
    headers: { "X-API-Key": MORALIS, accept: "application/json" },
  });
  if (!res.ok) return null;
  const json = await res.json();
  const arr = Array.isArray(json.result) ? json.result : [];

  const perc = arr
    .map((x) => x.percentage_relative_to_total_supply)
    .filter((x) => typeof x === "number");
  if (perc.length) return perc.reduce((a, b) => a + b, 0);

  const total = BigInt(json.total_supply ?? "0");
  const sum = arr.reduce((a, x) => a + BigInt(x.balance ?? "0"), 0n);
  if (total <= 0n) return null;

  const scaled = (sum * 10000n) / total;
  return Number(scaled) / 100;
}

console.log("MORALIS_API_KEY set:", Boolean(MORALIS));
console.log("Solscan SOL top10% (fallback if API absent):", await solscanTop10Smoke(SOL_MINT));
console.log("Solscan USDC(SOL) top10% (fallback if API absent):", await solscanTop10Smoke(SOL_USDC_MINT));
console.log("Moralis USDC(ETH) top10%:", await moralisTop10Percent(ETH_USDC.toLowerCase(), "eth"));

