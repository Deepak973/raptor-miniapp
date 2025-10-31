"use client";

interface SwapWidgetProps {
  tokenSymbol?: string;
  tokenAddress?: string;
}

export default function SwapWidget({
  tokenSymbol = "TOKEN",
  tokenAddress,
}: SwapWidgetProps) {
  // Default to USDC as input currency (0x6b175474e89094c44da98b954eedeac495271d0f)
  // If tokenAddress is provided, use it as output currency
  const inputCurrency = "0x6b175474e89094c44da98b954eedeac495271d0f"; // USDC
  const outputCurrency = tokenAddress || undefined;

  // Build Uniswap URL
  const uniswapUrl = outputCurrency
    ? `https://app.uniswap.org/#/swap?field=input&value=10&inputCurrency=${inputCurrency}&outputCurrency=${outputCurrency}`
    : `https://app.uniswap.org/#/swap?field=input&value=10&inputCurrency=${inputCurrency}`;

  return (
    <div className="glass-panel rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-[#00FF88]">Buy {tokenSymbol}</h3>
        <div className="flex items-center space-x-2 text-xs text-gray-400">
          <span>Powered by</span>
          <span className="text-[#00FF88] font-semibold">Uniswap</span>
        </div>
      </div>

      {/* Uniswap Iframe */}
      <div className="relative">
        <iframe
          src={uniswapUrl}
          height="660px"
          width="100%"
          style={{
            border: 0,
            margin: 0,
            display: "block",
            borderRadius: "16px",
            maxWidth: "100%",
            minWidth: "300px",
          }}
          title="Uniswap Swap Widget"
        />
      </div>

      {/* Info */}
      <div className="text-xs text-gray-500 text-center space-y-1">
        <p>Swap USDC for {tokenSymbol || "any token"} directly</p>
        {tokenAddress && (
          <div className="font-mono text-gray-600 truncate text-xs">
            {tokenAddress}
          </div>
        )}
        <p className="text-[#00FF88]">🔗 Integrated with Uniswap V3</p>
      </div>
    </div>
  );
}
