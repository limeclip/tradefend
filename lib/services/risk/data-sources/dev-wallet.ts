export type DevWalletRiskInput = {
  tokenAddress?: string; // EVM token contract or Solana mint
  chain?: string;
  devWalletAddress?: string; // if we can infer it (e.g., from DexScreener / creator)
  solanaMint?: string;
};

export async function fetchDevWalletSoldPercent(
  input: DevWalletRiskInput,
): Promise<number | null> {
  const { tokenAddress, chain, devWalletAddress, solanaMint } = input;

  // =========================
  // EVM path (Etherscan)
  // =========================
  if (tokenAddress && tokenAddress.startsWith("0x")) {
    const key = process.env.ETHERSCAN_API_KEY;
    if (!key) return null;

    const cfg = getEtherscanChainConfig(chain ?? "ethereum");
    if (!cfg) return null;

    const token = tokenAddress.toLowerCase();

    // 1) Infer dev wallet (contract creator) if not provided.
    const dev =
      devWalletAddress?.toLowerCase() ??
      (await inferContractCreator({ token, cfg, apiKey: key }));

    if (!dev) return null;

    // 2) Compute 7d transfer outflow from dev.
    const nowSeconds = Math.floor(Date.now() / 1000);
    const startSeconds = nowSeconds - 7 * 24 * 60 * 60;

    const [startBlock, endBlock] = await Promise.all([
      getBlockNumberByTime({ seconds: startSeconds, cfg, apiKey: key }),
      getBlockNumberByTime({ seconds: nowSeconds, cfg, apiKey: key }),
    ]);

    if (!startBlock || !endBlock) return null;

    const soldAmountRaw = await sumDevOutgoingTokenTransfers({
      token,
      devAddress: dev,
      cfg,
      apiKey: key,
      startBlock,
      endBlock,
    });

    // 3) Proxy dev holdings by current token balance.
    const balanceRaw = await fetchEvmTokenBalance({
      token,
      devAddress: dev,
      cfg,
      apiKey: key,
    });
    const ZERO = BigInt(0);
    if (!balanceRaw || balanceRaw <= ZERO) return null;

    // soldPercent = sold / balance * 100
    const soldPercentScaled = (soldAmountRaw * BigInt(10000)) / balanceRaw;
    const soldPercent = Number(soldPercentScaled) / 100;

    if (!Number.isFinite(soldPercent)) return null;
    return Math.max(0, Math.min(100, soldPercent));
  }

  // =========================
  // Solana path (RugCheck)
  // =========================
  const mint = solanaMint ?? tokenAddress;
  if (mint && typeof mint === "string") {
    const rugKey = process.env.RUGCHECK_API_KEY;
    if (!rugKey) return null;

    try {
      const res = await fetch(
        `https://api.rugcheck.xyz/v1/tokens/${encodeURIComponent(mint)}/report/summary`,
        {
          method: "GET",
          headers: {
            accept: "application/json",
            "X-API-KEY": rugKey,
          },
          cache: "no-store",
        },
      );
      if (!res.ok) return null;

      const json = (await res.json()) as unknown;
      const maybe = extractNumberByGuesses(json, [
        ["data", "devActivity", "soldPercent"],
        ["data", "devActivity", "sold_percent"],
        ["data", "devSoldPercent"],
        ["devActivity", "soldPercent"],
        ["devActivity", "sold_percent"],
      ]);

      if (maybe === null) return null;
      return Math.max(0, Math.min(100, maybe));
    } catch (e) {
      console.error("fetchDevWalletSoldPercent (RugCheck) failed", e);
      return null;
    }
  }

  return null;
}

type EtherscanChainConfig = {
  apiBaseUrl: string;
  chainId: string;
};

const ETHERSCAN_CHAINS: Record<string, EtherscanChainConfig> = {
  ethereum: { apiBaseUrl: "https://api.etherscan.io/api", chainId: "1" },
  eth: { apiBaseUrl: "https://api.etherscan.io/api", chainId: "1" },
  bsc: { apiBaseUrl: "https://api.bscscan.com/api", chainId: "56" },
  polygon: { apiBaseUrl: "https://api.polygonscan.com/api", chainId: "137" },
  arbitrum: { apiBaseUrl: "https://api.arbiscan.io/api", chainId: "42161" },
  optimism: { apiBaseUrl: "https://api-optimistic.etherscan.io/api", chainId: "10" },
  base: { apiBaseUrl: "https://api.basescan.org/api", chainId: "8453" },
};

function getEtherscanChainConfig(chain: string): EtherscanChainConfig | null {
  return ETHERSCAN_CHAINS[chain.trim().toLowerCase()] ?? null;
}

function toBigInt(value: unknown): bigint | null {
  if (typeof value === "bigint") return value;
  if (typeof value === "number" && Number.isFinite(value)) return BigInt(Math.trunc(value));
  if (typeof value === "string" && value.trim()) {
    try {
      return BigInt(value.trim());
    } catch {
      return null;
    }
  }
  return null;
}

function parseNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function extractNumberByGuesses(obj: unknown, paths: string[][]): number | null {
  for (const p of paths) {
    const val = getNested(obj, p);
    const n = parseNumber(val);
    if (n !== null) return n;
  }
  return null;
}

function getNested(obj: unknown, path: string[]): unknown {
  let current: unknown = obj;
  for (const key of path) {
    if (!current || typeof current !== "object") return undefined;
    const rec = current as Record<string, unknown>;
    current = rec[key];
  }
  return current;
}

type EtherscanContractCreationResponse = {
  status?: string;
  message?: string;
  result?: Array<{
    contractCreator?: string;
    timestamp?: string;
  }>;
};

async function inferContractCreator(input: {
  token: string;
  cfg: EtherscanChainConfig;
  apiKey: string;
}): Promise<string | null> {
  const url = `${input.cfg.apiBaseUrl}?module=contract&action=getcontractcreation&contractaddresses=${encodeURIComponent(
    input.token,
  )}&chainid=${encodeURIComponent(input.cfg.chainId)}&apikey=${encodeURIComponent(input.apiKey)}`;

  const res = await fetch(url, { method: "GET", cache: "no-store" });
  if (!res.ok) return null;

  const json = (await res.json()) as EtherscanContractCreationResponse;
  const creator = json?.result?.[0]?.contractCreator;
  if (!creator || typeof creator !== "string") return null;
  return creator.toLowerCase();
}

type GetBlockNoByTimeResponse = {
  status?: string;
  message?: string;
  result?: string;
};

async function getBlockNumberByTime(input: {
  seconds: number;
  cfg: EtherscanChainConfig;
  apiKey: string;
}): Promise<bigint | null> {
  const url = `${input.cfg.apiBaseUrl}?module=block&action=getblocknobytime&timestamp=${encodeURIComponent(
    String(input.seconds),
  )}&closest=before&chainid=${encodeURIComponent(input.cfg.chainId)}&apikey=${encodeURIComponent(
    input.apiKey,
  )}`;

  const res = await fetch(url, { method: "GET", cache: "no-store" });
  if (!res.ok) return null;

  const json = (await res.json()) as GetBlockNoByTimeResponse;
  const blockRaw = json?.result;
  const blockBig = toBigInt(blockRaw);
  return blockBig;
}

type TokenBalanceResponse = {
  status?: string;
  message?: string;
  result?: string;
};

async function fetchEvmTokenBalance(input: {
  token: string;
  devAddress: string;
  cfg: EtherscanChainConfig;
  apiKey: string;
}): Promise<bigint | null> {
  const url = `${input.cfg.apiBaseUrl}?module=account&action=tokenbalance&contractaddress=${encodeURIComponent(
    input.token,
  )}&address=${encodeURIComponent(input.devAddress)}&tag=latest&chainid=${encodeURIComponent(
    input.cfg.chainId,
  )}&apikey=${encodeURIComponent(input.apiKey)}`;

  const res = await fetch(url, { method: "GET", cache: "no-store" });
  if (!res.ok) return null;
  const json = (await res.json()) as TokenBalanceResponse;
  return toBigInt(json?.result);
}

type TokenTxResponse = {
  status?: string;
  message?: string;
  result?: Array<{
    from?: string;
    to?: string;
    value?: string;
  }>;
};

async function sumDevOutgoingTokenTransfers(input: {
  token: string;
  devAddress: string;
  cfg: EtherscanChainConfig;
  apiKey: string;
  startBlock: bigint;
  endBlock: bigint;
}): Promise<bigint> {
  const limit = 1000;
  const maxPages = 3;

  let page = 1;
  let acc = BigInt(0);

  while (page <= maxPages) {
    const url = `${input.cfg.apiBaseUrl}?module=account&action=tokentx&contractaddress=${encodeURIComponent(
      input.token,
    )}&address=${encodeURIComponent(input.devAddress)}&startblock=${encodeURIComponent(
      input.startBlock.toString(),
    )}&endblock=${encodeURIComponent(input.endBlock.toString())}&page=${encodeURIComponent(
      String(page),
    )}&offset=${encodeURIComponent(String(limit))}&sort=desc&apikey=${encodeURIComponent(
      input.apiKey,
    )}`;

    const res = await fetch(url, { method: "GET", cache: "no-store" });
    if (!res.ok) break;

    const json = (await res.json()) as TokenTxResponse;
    const rows = Array.isArray(json.result) ? json.result : [];
    if (!rows.length) break;

    for (const r of rows) {
      const from = r.from?.toLowerCase();
      const to = r.to?.toLowerCase();
      if (!from || !to) continue;

      // "Outgoing" transfers from dev to others (proxy for dev sells)
      if (from === input.devAddress && to !== input.devAddress) {
        const v = toBigInt(r.value);
        if (v) acc += v;
      }
    }

    if (rows.length < limit) break;
    page += 1;
  }

  return acc;
}

