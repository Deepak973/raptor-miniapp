// Token service for fetching token details from GeckoTerminal API
export interface TokenDetails {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  image_url: string;
  price_usd: number;
  market_cap_usd: number;
  volume_usd: { h24: number };
}

export const fetchTokenDetails = async (
  tokenAddress: string
): Promise<TokenDetails | null> => {
  try {
    const response = await fetch(
      `https://api.geckoterminal.com/api/v2/networks/base/tokens/${tokenAddress}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch token details: ${response.status}`);
    }

    const data = await response.json();

    if (data.data && data.data.attributes) {
      return {
        address: data.data.attributes.address,
        name: data.data.attributes.name,
        symbol: data.data.attributes.symbol,
        decimals: data.data.attributes.decimals,
        image_url: data.data.attributes.image_url,
        price_usd: parseFloat(data.data.attributes.price_usd),
        market_cap_usd: parseFloat(data.data.attributes.market_cap_usd),
        volume_usd: { h24: parseFloat(data.data.attributes.volume_usd.h24) },
      };
    }

    return null;
  } catch (error) {
    console.error("Error fetching token details:", error);
    return null;
  }
};

// Format time to ET timezone
export const formatTimeET = (timestamp: bigint): string => {
  // Convert GMT epoch timestamp to local time
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
};

// Format time until expiry in ET
export const getTimeUntilExpiryET = (expiry: bigint): string => {
  const now = BigInt(Math.floor(Date.now() / 1000));
  const diff = expiry - now;

  if (diff <= 0) return "Expired";

  const days = Number(diff) / (24 * 60 * 60);
  const hours = (Number(diff) % (24 * 60 * 60)) / (60 * 60);
  const minutes = (Number(diff) % (60 * 60)) / 60;

  if (days >= 1) return `${Math.floor(days)}d ${Math.floor(hours)}h`;
  if (hours >= 1) return `${Math.floor(hours)}h ${Math.floor(minutes)}m`;
  return `${Math.floor(minutes)}m`;
};
