"use client";

import { useState } from "react";
import { CopyButton } from "../../components/ui/CopyButton";

interface TokenData {
  name: string;
  symbol: string;
  decimals: number;
  address: string;
  currentPrice: number;
  image_url?: string;
  market_cap_usd?: number;
  volume_usd?: { h24: number };
}

interface TokenFetcherProps {
  onTokenFetched: (tokenData: TokenData) => void;
}

export default function TokenFetcher({ onTokenFetched }: TokenFetcherProps) {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tokenData, setTokenData] = useState<TokenData | null>(null);

  // Example addresses for quick testing
  const exampleAddresses = [
    "0xcbD06E5A2B0C65597161de254AA074E489dEb510", // cbDOGE
    "0x1bc0c42215582d5a085795f4badbac3ff36d1bcb", // TokenBot
    "0x9cb41fd9dc6891bae8187029461bfaadf6cc0c69", // Noice
    "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC
    "0x4200000000000000000000000000000000000006", // WETH
  ];

  const fetchTokenData = async () => {
    setLoading(true);
    setError("");

    try {
      // Check if address is valid (basic check)
      if (!address.startsWith("0x") || address.length !== 42) {
        throw new Error("Invalid Ethereum address format");
      }

      // Fetch from GeckoTerminal API
      const response = await fetch(
        `https://api.geckoterminal.com/api/v2/networks/base/tokens/${address}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch token data: ${response.status}`);
      }

      const data = await response.json();

      if (!data.data || !data.data.attributes) {
        throw new Error("Token not found on Base network");
      }

      const tokenAttributes = data.data.attributes;
      const token: TokenData = {
        name: tokenAttributes.name,
        symbol: tokenAttributes.symbol,
        decimals: tokenAttributes.decimals,
        address: tokenAttributes.address,
        currentPrice: parseFloat(tokenAttributes.price_usd),
        image_url: tokenAttributes.image_url,
        market_cap_usd: parseFloat(tokenAttributes.market_cap_usd),
        volume_usd: { h24: parseFloat(tokenAttributes.volume_usd.h24) },
      };

      setTokenData(token);
      onTokenFetched(token);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch token data"
      );
      setTokenData(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePasteExample = (exampleAddress: string) => {
    setAddress(exampleAddress);
    setError("");
    setTokenData(null);
  };

  return (
    <div className="glass-panel rounded-2xl p-6 space-y-4">
      <div>
        <h3 className="text-xl font-bold text-[#00FF88] mb-2">Token Details</h3>
        <p className="text-sm text-gray-400">
          Paste an ERC-20 token contract address to fetch its details and
          current price
        </p>
      </div>

      {/* Input */}
      <div className="space-y-2">
        <label className="text-sm text-gray-300">Contract Address</label>
        <div className="flex space-x-2">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="0x..."
            className="flex-1 bg-black/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00FF88]/50 font-mono text-sm"
          />
          <button
            onClick={fetchTokenData}
            disabled={loading || !address}
            className="bg-gradient-to-r from-[#00FF88] to-[#00AA55] text-black font-bold px-6 py-3 rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {loading ? "..." : "Fetch"}
          </button>
        </div>
      </div>

      {/* Example Addresses */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-gray-500">Try:</span>
        {exampleAddresses.map((addr) => (
          <button
            key={addr}
            onClick={() => handlePasteExample(addr)}
            className="text-xs bg-black/40 hover:bg-black/60 text-[#00FF88] px-2 py-1 rounded border border-[#00FF88]/30 transition-all"
          >
            {addr === "0xcbD06E5A2B0C65597161de254AA074E489dEb510"
              ? "cbDOGE"
              : addr === "0x1bc0c42215582d5a085795f4badbac3ff36d1bcb"
              ? "TokenBot"
              : addr === "0x9cb41fd9dc6891bae8187029461bfaadf6cc0c69"
              ? "Noice"
              : addr === "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
              ? "USDC"
              : addr === "0x4200000000000000000000000000000000000006"
              ? "WETH"
              : "Token"}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Token Data Display */}
      {tokenData && (
        <div className="bg-black/40 border border-[#00FF88]/30 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {tokenData.image_url && (
                <img
                  src={tokenData.image_url}
                  alt={tokenData.symbol}
                  className="w-8 h-8 rounded-full"
                />
              )}
              <div>
                <h4 className="text-lg font-bold text-white">
                  {tokenData.name}
                </h4>
                <p className="text-sm text-gray-400">{tokenData.symbol}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Current Price</p>
              <p className="text-xl font-bold text-[#00FF88]">
                ${tokenData.currentPrice.toFixed(6)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-black/30 rounded-lg p-2">
              <p className="text-gray-500 text-xs mb-1">Decimals</p>
              <p className="text-white font-semibold">{tokenData.decimals}</p>
            </div>
            <div className="bg-black/30 rounded-lg p-2">
              <p className="text-gray-500 text-xs mb-1">Network</p>
              <p className="text-white font-semibold">Base</p>
            </div>
          </div>

          {tokenData.market_cap_usd && (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-black/30 rounded-lg p-2">
                <p className="text-gray-500 text-xs mb-1">Market Cap</p>
                <p className="text-white font-semibold">
                  ${(tokenData.market_cap_usd / 1000000).toFixed(2)}M
                </p>
              </div>
              <div className="bg-black/30 rounded-lg p-2">
                <p className="text-gray-500 text-xs mb-1">24h Volume</p>
                <p className="text-white font-semibold">
                  ${((tokenData.volume_usd?.h24 || 0) / 1000).toFixed(0)}K
                </p>
              </div>
            </div>
          )}

          <div className="bg-black/30 rounded-lg p-2">
            <p className="text-gray-500 text-xs mb-1">Contract Address</p>
            <div className="flex items-center gap-2">
              <p className="text-white font-mono text-xs break-all flex-1">
                {tokenData.address.slice(0, 6)}...{tokenData.address.slice(-4)}
              </p>
              <CopyButton text={tokenData.address} />
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs text-gray-400 pt-2 border-t border-gray-800">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span>Live price from GeckoTerminal</span>
          </div>
        </div>
      )}
    </div>
  );
}
