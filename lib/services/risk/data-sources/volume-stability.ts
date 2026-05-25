export async function fetchVolumeStabilityPercentChange(
  input: {
    query: string;
    tokenAddress?: string;
    chain?: string;
    solanaMint?: string;
    pairAddress?: string;
  },
): Promise<number | null> {
  const { chain, pairAddress } = input;

  if (!chain || !pairAddress) return null;

  // Best-effort: DexScreener pair endpoint may include previous 24h volume fields.
  // We try multiple key names; if none exist we return null (neutral scoring upstream).
  const url = `https://api.dexscreener.com/latest/dex/pairs/${encodeURIComponent(
    chain,
  )}/${encodeURIComponent(pairAddress)}`;

  try {
    const res = await fetch(url, { method: "GET", cache: "no-store", headers: { accept: "application/json" } });
    if (!res.ok) return null;

    const json = (await res.json()) as unknown;
    const volumeRecord = getRecord(getNested(json, ["volume"]));
    if (!volumeRecord) return null;

    const current = toNumber(volumeRecord["h24"]);
    const prev =
      toNumber(
        (volumeRecord["h24Prev"] ??
          volumeRecord["h24_prev"] ??
          volumeRecord["h24_previous"] ??
          volumeRecord["prevH24"] ??
          volumeRecord["h24Ago"]) as unknown,
      ) ?? null;

    if (current === null || prev === null || prev <= 0) return null;
    return ((current - prev) / prev) * 100;
  } catch (e) {
    console.error("fetchVolumeStabilityPercentChange failed", e);
    return null;
  }
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
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

function getRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
}

