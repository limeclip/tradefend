/** Query params for the Safe Position Builder page. */
export type BuildPositionSearchParams = {
  address: string;
  chain?: string;
  ticker?: string;
  price: string;
};

export function buildBuildPositionUrl(params: {
  address: string;
  chain?: string | null;
  ticker?: string | null;
  price: number;
}): string {
  const search = new URLSearchParams();
  search.set('address', params.address.trim());
  if (params.chain?.trim()) {
    search.set('chain', params.chain.trim());
  }
  if (params.ticker?.trim()) {
    search.set('ticker', params.ticker.trim());
  }
  search.set('price', String(params.price));
  return `/guardian/build-position?${search.toString()}`;
}

export function parseBuildPositionSearchParams(
  searchParams: URLSearchParams,
): BuildPositionSearchParams | null {
  const address = searchParams.get('address')?.trim() ?? '';
  const price = searchParams.get('price')?.trim() ?? '';
  if (!address || !price) return null;

  const chain = searchParams.get('chain')?.trim();
  const ticker = searchParams.get('ticker')?.trim();

  return {
    address,
    price,
    ...(chain ? { chain } : {}),
    ...(ticker ? { ticker } : {}),
  };
}
