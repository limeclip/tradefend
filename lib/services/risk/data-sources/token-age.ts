export async function fetchTokenAgeDays(
  input: {
    query: string;
    tokenAddress?: string;
    chain?: string;
    solanaMint?: string;
    // Optional, can be passed in from DexScreener to avoid re-fetching.
    pairCreatedAt?: number;
  },
): Promise<number | null> {
  const { tokenAddress, chain, pairCreatedAt } = input;

  // 1) DexScreener-based age (fast path)
  if (pairCreatedAt && Number.isFinite(pairCreatedAt) && pairCreatedAt > 0) {
    // If it looks like seconds, convert to ms.
    const createdAtMs = pairCreatedAt < 1_000_000_000_000 ? pairCreatedAt * 1000 : pairCreatedAt;
    const diffMs = Date.now() - createdAtMs;
    const days = diffMs / (1000 * 60 * 60 * 24);
    if (!Number.isFinite(days) || days < 0) return null;
    return Math.max(0, days);
  }

  // 2) EVM fallback using Etherscan getcontractcreation
  if (tokenAddress && tokenAddress.startsWith("0x")) {
    const key = process.env.ETHERSCAN_API_KEY;
    if (!key) return null;

    const chainKey = (chain ?? "").trim().toLowerCase();
    const cfg = getEtherscanChainConfig(chainKey);
    if (!cfg) return null;

    const url = `${cfg.apiBaseUrl}?module=contract&action=getcontractcreation&contractaddresses=${encodeURIComponent(
      tokenAddress,
    )}&chainid=${encodeURIComponent(cfg.chainId)}&apikey=${encodeURIComponent(key)}`;

    try {
      const res = await fetch(url, { method: "GET", cache: "no-store" });
      if (!res.ok) return null;

      const json = (await res.json()) as EtherscanContractCreationResponse;
      const tsRaw = json?.result?.[0]?.timestamp;
      const createdAtSeconds =
        typeof tsRaw === "string" ? Number(tsRaw) : typeof tsRaw === "number" ? tsRaw : NaN;
      if (!Number.isFinite(createdAtSeconds) || createdAtSeconds <= 0) return null;

      const createdAtMs = createdAtSeconds * 1000;
      const diffMs = Date.now() - createdAtMs;
      const days = diffMs / (1000 * 60 * 60 * 24);
      if (!Number.isFinite(days) || days < 0) return null;
      return Math.max(0, days);
    } catch (e) {
      console.error("fetchTokenAgeDays failed", e);
      return null;
    }
  }

  // 3) Solana fallback (Solscan / Birdeye) will be implemented in later steps
  return null;
}

type EtherscanChainConfig = {
  chainId: string;
  apiBaseUrl: string;
};

function getEtherscanChainConfig(chain: string): EtherscanChainConfig | null {
  const cfgs: Record<string, EtherscanChainConfig> = {
    ethereum: { chainId: "1", apiBaseUrl: "https://api.etherscan.io/api" },
    eth: { chainId: "1", apiBaseUrl: "https://api.etherscan.io/api" },
    bsc: { chainId: "56", apiBaseUrl: "https://api.bscscan.com/api" },
    polygon: { chainId: "137", apiBaseUrl: "https://api.polygonscan.com/api" },
    arbitrum: { chainId: "42161", apiBaseUrl: "https://api.arbiscan.io/api" },
    optimism: { chainId: "10", apiBaseUrl: "https://api-optimistic.etherscan.io/api" },
    base: { chainId: "8453", apiBaseUrl: "https://api.basescan.org/api" },
  };

  return cfgs[chain] ?? null;
}

type EtherscanContractCreationResponse = {
  status?: string;
  message?: string;
  result?: Array<{
    timestamp?: string | number;
  }>;
};

