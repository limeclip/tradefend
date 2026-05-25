// lib/services/risk/data-sources/holders/evm-holders.ts

/**
 * EVM top holders source: Moralis Web3 Data API.
 *
 * Endpoint:
 * GET https://deep-index.moralis.io/api/v2.2/erc20/{token_address}/owners?chain=eth&order=DESC&limit=10
 *
 * It returns:
 * - result[] with balances + `percentage_relative_to_total_supply`
 * - `total_supply`
 */

type MoralisChain =
  | "eth"
  | "bsc"
  | "polygon"
  | "arbitrum"
  | "optimism"
  | "base"
  | "avalanche"
  | "fantom"
  | string;

type MoralisOwner = {
  owner_address?: string;
  owner_address_label?: string;
  balance?: string;
  balance_formatted?: string;
  is_contract?: boolean;
  percentage_relative_to_total_supply?: number;
  entity?: string;
};

type MoralisOwnersResponse = {
  result?: MoralisOwner[];
  total_supply?: string;
};

function toMoralisChain(chain: string): MoralisChain | null {
  const c = chain.trim().toLowerCase();
  if (!c) return null;

  // DexScreener -> Moralis mapping
  if (c === "ethereum" || c === "eth") return "eth";
  if (c === "bsc" || c === "binance-smart-chain") return "bsc";
  if (c === "polygon" || c === "matic") return "polygon";
  if (c === "arbitrum") return "arbitrum";
  if (c === "optimism") return "optimism";
  if (c === "base") return "base";
  if (c === "avalanche" || c === "avax") return "avalanche";
  if (c === "fantom") return "fantom";

  // As-is fallback (Moralis accepts many chains by name/hex chain id)
  return c;
}

function toBigInt(value: unknown): bigint | null {
  if (typeof value === "bigint") return value;
  if (typeof value === "string" && value.trim()) {
    try {
      return BigInt(value.trim());
    } catch {
      return null;
    }
  }
  if (typeof value === "number" && Number.isFinite(value)) return BigInt(Math.trunc(value));
  return null;
}

function clampPercent(p: number): number {
  if (!Number.isFinite(p)) return 0;
  return Math.max(0, Math.min(100, p));
}

export async function fetchTop10HoldersEvmPercent(
  tokenAddress: string,
  chain: string,
): Promise<number | null> {
  const apiKey = process.env.MORALIS_API_KEY;
  if (!apiKey) {
    console.warn("[Moralis] MORALIS_API_KEY not configured");
    return null;
  }

  const moralisChain = toMoralisChain(chain);
  if (!moralisChain) {
    console.warn("[Moralis] Unsupported/unknown chain", { chain });
    return null;
  }

  const addr = tokenAddress.trim();
  if (!addr.startsWith("0x")) return null;
  const token = addr.toLowerCase();

  const url = `https://deep-index.moralis.io/api/v2.2/erc20/${encodeURIComponent(
    token,
  )}/owners?chain=${encodeURIComponent(moralisChain)}&order=DESC&limit=10`;

  console.log("[Moralis] Fetching top10 holders", { chain: moralisChain, token });

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        accept: "application/json",
        "X-API-Key": apiKey,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.warn("[Moralis] Non-OK response", {
        status: res.status,
        body: text.slice(0, 300),
      });
      return null;
    }

    const json = (await res.json()) as MoralisOwnersResponse;
    const owners = Array.isArray(json.result) ? json.result : [];

    if (!owners.length) {
      console.warn("[Moralis] Empty holders result", { chain: moralisChain, token });
      return null;
    }

    // Preferred: already computed percentages.
    const percents = owners
      .slice(0, 10)
      .map((o) => o.percentage_relative_to_total_supply)
      .filter((p): p is number => typeof p === "number" && Number.isFinite(p));

    if (percents.length >= 5) {
      const sum = clampPercent(percents.reduce((a, b) => a + b, 0));
      const rounded = Math.round(sum);
      console.log("[Moralis] top10% via percentage_relative_to_total_supply", {
        rounded,
        sample: owners.slice(0, 3).map((o) => ({
          owner: o.owner_address,
          label: o.owner_address_label,
          percent: o.percentage_relative_to_total_supply,
          entity: o.entity,
        })),
      });
      return rounded;
    }

    // Fallback: compute using balances/total_supply.
    const totalSupply = toBigInt(json.total_supply);
    const ZERO = BigInt(0);
    if (!totalSupply || totalSupply <= ZERO) {
      console.warn("[Moralis] Missing total_supply; cannot compute percent");
      return null;
    }

    const top10Sum = owners.slice(0, 10).reduce((acc, o) => {
      const b = toBigInt(o.balance);
      return b ? acc + b : acc;
    }, ZERO);

    if (top10Sum <= ZERO) {
      console.warn("[Moralis] top10Sum is zero; cannot compute percent");
      return null;
    }

    const scaled = (top10Sum * BigInt(10000)) / totalSupply;
    const percent = Number(scaled) / 100;
    if (!Number.isFinite(percent)) return null;

    const rounded = Math.round(clampPercent(percent));
    console.log("[Moralis] top10% via balances/total_supply", {
      rounded,
      top10Sum: top10Sum.toString().slice(0, 24) + "...",
      totalSupply: totalSupply.toString().slice(0, 24) + "...",
    });
    return rounded;
  } catch (e) {
    console.error("[Moralis] fetchTop10HoldersEvmPercent failed", e);
    return null;
  }
}