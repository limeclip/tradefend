export function normalizeCompareAddress(address: string): string {
  const trimmed = address.trim();
  if (trimmed.startsWith('0x')) {
    return trimmed.toLowerCase();
  }
  return trimmed;
}

export function buildCompareUrl(params: { addresses: string[]; chain?: string | null }): string {
  const addresses = params.addresses.map(normalizeCompareAddress).filter(Boolean);
  const search = new URLSearchParams();

  if (addresses.length === 1) {
    search.set('address', addresses[0]!);
  } else if (addresses.length > 1) {
    search.set('addresses', addresses.join(','));
  }

  const chain = params.chain?.trim();
  if (chain) {
    search.set('chain', chain);
  }

  const query = search.toString();
  return query ? `/compare?${query}` : '/compare';
}

export function parseCompareSearchParams(searchParams: URLSearchParams): {
  addresses: string[];
  chain: string;
} {
  const chain = searchParams.get('chain')?.trim() ?? '';
  const single = searchParams.get('address')?.trim();
  const multi = searchParams.get('addresses')?.trim();

  let addresses: string[] = [];
  if (multi) {
    addresses = multi
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);
  } else if (single) {
    addresses = [single];
  }

  return { addresses, chain };
}
