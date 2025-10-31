"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Toaster, toast } from "react-hot-toast";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import TokenFetcher from "../components/TokenFetcher";
import { useAccount } from "wagmi";
import { useCreateAlpha } from "../../lib/hooks";
import { useStakeTokenInfo } from "../../lib/hooks";
import { useTokenApprove } from "../../hooks/useToken";
import { parseTokenAmount } from "../../lib/contract";
import { ALPHA_CONTRACT_ADDRESS } from "../../lib/otherConstants";
import { Drawer } from "../../components/ui/Drawer";

interface TokenData {
  name: string;
  symbol: string;
  decimals: number;
  address: string;
  currentPrice: number;
  image_url?: string;
}

export default function CreateAlpha() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [targetPrice, setTargetPrice] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [expiryTime, setExpiryTime] = useState("");
  const [stake, setStake] = useState("");
  const [needsApproval, setNeedsApproval] = useState(false);
  const [minDateTime, setMinDateTime] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Contract hooks
  const { data: stakeTokenInfo } = useStakeTokenInfo();

  // Use useTokenApprove hook
  const {
    allowance,
    approve,
    loading: isApproving,
    fetchAllowance,
  } = useTokenApprove({
    token: stakeTokenInfo?.address as `0x${string}`,
    owner: address as `0x${string}`,
    spender: ALPHA_CONTRACT_ADDRESS as `0x${string}`,
    onPrompt: () => {
      toast.loading("Approving USDC spending...");
    },
    onSubmitted: () => {
      toast.dismiss();
      toast.loading("Transaction submitted...");
    },
    onSuccess: () => {
      toast.dismiss();
      toast.success("USDC approved! You can now create your alpha.");
      fetchAllowance();
    },
    onError: (err) => {
      toast.dismiss();
      toast.error(
        err instanceof Error ? err.message : "Failed to approve USDC"
      );
    },
  });

  const {
    createAlpha,
    isPending: isCreating,
    isConfirming,
    isSuccess: isCreated,
    error: createError,
  } = useCreateAlpha();

  // Set minimum datetime to current time in GMT
  useEffect(() => {
    const now = new Date();
    const gmtNow = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
    const minDate = gmtNow.toISOString().split("T")[0];
    const minTime = gmtNow.toTimeString().split(" ")[0].substring(0, 5);
    setMinDateTime(`${minDate}T${minTime}`);
  }, []);

  const handleTokenFetched = (token: TokenData) => {
    setTokenData(token);
    // Pre-fill with current price + 10%
    const suggestedPrice = token.currentPrice * 1.1;
    setTargetPrice(suggestedPrice.toFixed(8));
    // Open drawer when token is selected
    setDrawerOpen(true);
  };

  // Check if user needs to approve USDC
  useEffect(() => {
    if (!stake || !stakeTokenInfo || !address || allowance === undefined) {
      setNeedsApproval(false);
      return;
    }

    const stakeAmount = parseTokenAmount(stake, stakeTokenInfo.decimals);
    const hasEnoughAllowance = allowance >= stakeAmount;
    setNeedsApproval(!hasEnoughAllowance);
  }, [stake, stakeTokenInfo, address, allowance]);

  // Close drawer on success
  useEffect(() => {
    if (isCreated) {
      setDrawerOpen(false);
      router.push("/my-alphas");
    }
  }, [isCreated, router]);

  // Helper function to format price with conditional decimal rounding
  const formatPrice = (price: number) => {
    if (price > 1000000) {
      return (price / 1e18).toFixed(2);
    }
    if (price >= 1) {
      return price.toFixed(2);
    } else if (price >= 0.01) {
      return price.toFixed(4);
    } else {
      const str = price.toFixed(8);
      const parts = str.split(".");
      if (parts[1]) {
        const decimals = parts[1];
        let lastNonZero = decimals.length;
        for (let i = decimals.length - 1; i >= 0; i--) {
          if (decimals[i] !== "0") {
            lastNonZero = i + 1;
            break;
          }
        }
        return parts[0] + "." + decimals.substring(0, lastNonZero);
      }
      return str;
    }
  };

  const formatCondition = () => {
    if (!tokenData || !targetPrice || !expiryDate || !expiryTime) {
      return "Please fill all fields to generate condition";
    }

    const dateObj = new Date(`${expiryDate}T${expiryTime}:00Z`);
    const gmtTimeStr = dateObj.toLocaleString("en-US", {
      timeZone: "GMT",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    const now = new Date();
    const diffMs = dateObj.getTime() - now.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    let timeFromNow = "";
    if (hours > 0) {
      timeFromNow = `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      timeFromNow = `${minutes}m`;
    } else {
      timeFromNow = "Less than 1 minute";
    }

    return `${tokenData.symbol} will close above $${formatPrice(
      parseFloat(targetPrice)
    )} at ${gmtTimeStr} GMT (${timeFromNow} from now)`;
  };

  const handleApprove = async () => {
    if (!stakeTokenInfo || !stake) return;
    const stakeAmount = parseTokenAmount(stake, stakeTokenInfo.decimals);
    await approve(stakeAmount);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!tokenData || !targetPrice || !expiryDate || !expiryTime || !stake) {
      toast.error("Please fill all fields");
      return;
    }

    if (!stakeTokenInfo) {
      toast.error("Loading token information...");
      return;
    }

    if (needsApproval) {
      toast.error("Please approve USDC spending first");
      return;
    }

    try {
      const expiryTimestamp = Math.floor(
        new Date(`${expiryDate}T${expiryTime}:00Z`).getTime() / 1000
      );

      toast.promise(
        createAlpha(
          tokenData.address,
          tokenData.symbol,
          targetPrice,
          expiryTimestamp,
          stake,
          tokenData.image_url || ""
        ),
        {
          loading: "Creating your alpha...",
          success: "Alpha created successfully!",
          error: "Failed to create alpha. Please try again.",
        }
      );
    } catch (err) {
      console.error("Alpha creation failed:", err);
    }
  };

  const priceChangePercent =
    tokenData && targetPrice
      ? (
          ((parseFloat(targetPrice) - tokenData.currentPrice) /
            tokenData.currentPrice) *
          100
        ).toFixed(2)
      : "0";

  const usdcBalance = 0; // TODO: Get from hook if needed
  const hasInsufficientBalance = () => {
    if (!stake || stake === "" || !usdcBalance) return false;
    const stakeAmount = Number(stake);
    return stakeAmount > 0 && stakeAmount > usdcBalance;
  };

  return (
    <div className="min-h-screen flex flex-col pb-20 md:pb-0">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-4 mb-4">
            <div className="relative w-12 h-12">
              <Image
                src="/r-logo.png"
                alt="RAPTOR Logo"
                fill
                className="object-contain"
              />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00FF88] to-[#00AA55] font-mono">
              Create Alpha
            </h1>
          </div>
          <p className="text-gray-400 max-w-2xl mx-auto font-mono">
            Select a token and set your prediction parameters.
          </p>
        </div>

        {/* Token Fetcher */}
        <div className="max-w-2xl mx-auto">
          <TokenFetcher onTokenFetched={handleTokenFetched} />
        </div>

        {/* Preview Card - Show when token is selected */}
        {tokenData && (
          <div className="max-w-2xl mx-auto mt-8 glass-panel rounded-xl sm:rounded-2xl p-6">
            <div className="flex items-center space-x-4 mb-4">
              {tokenData.image_url && (
                <img
                  src={tokenData.image_url}
                  alt={tokenData.symbol}
                  className="w-12 h-12 rounded-full border-2 border-[#00FF88]/30"
                />
              )}
              <div>
                <h2 className="text-xl font-bold text-[#00FF88] font-mono">
                  {tokenData.symbol}
                </h2>
                <p className="text-sm text-gray-400 font-mono">
                  {tokenData.name}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-black/40 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1 font-mono">
                  Current Price
                </p>
                <p className="text-2xl font-bold text-[#00FF88] font-mono">
                  ${formatPrice(tokenData.currentPrice)}
                </p>
              </div>
              <div className="bg-black/40 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1 font-mono">Address</p>
                <p className="text-xs font-mono text-gray-300 break-all">
                  {tokenData.address.slice(0, 6)}...
                  {tokenData.address.slice(-4)}
                </p>
              </div>
            </div>
            <button
              onClick={() => setDrawerOpen(true)}
              className="w-full bg-gradient-to-r from-[#00FF88] to-[#00AA55] text-black font-bold py-4 rounded-xl hover:opacity-90 transition-all font-mono"
            >
              Configure Alpha
            </button>
          </div>
        )}
      </main>

      {/* Create Alpha Drawer */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Create Alpha"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Token Info */}
          {tokenData && (
            <div className="bg-black/40 rounded-lg p-4 flex items-center space-x-3">
              {tokenData.image_url && (
                <img
                  src={tokenData.image_url}
                  alt={tokenData.symbol}
                  className="w-10 h-10 rounded-full"
                />
              )}
              <div>
                <p className="font-bold text-[#00FF88] font-mono">
                  {tokenData.symbol}
                </p>
                <p className="text-xs text-gray-400 font-mono">
                  Current: ${formatPrice(tokenData.currentPrice)}
                </p>
              </div>
            </div>
          )}

          {/* Target Price */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-2">
              Target Price
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                $
              </span>
              <input
                type="number"
                step="any"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                placeholder="0.00"
                className="w-full bg-black/50 border border-gray-700 rounded-lg pl-8 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00FF88]/50 font-mono"
                required
              />
            </div>
            {tokenData && targetPrice && (
              <p className="text-xs text-gray-500 mt-1 font-mono">
                Current: ${formatPrice(tokenData.currentPrice)}
                <span
                  className={`ml-2 ${
                    parseFloat(priceChangePercent) >= 0
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  ({priceChangePercent}%)
                </span>
              </p>
            )}
          </div>

          {/* Expiry Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-2">
                Expiry Date (GMT)
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                min={minDateTime.split("T")[0]}
                className="w-full bg-black/50 border-2 border-gray-600 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00FF88] focus:ring-2 focus:ring-[#00FF88]/20 transition-all cursor-pointer hover:border-gray-500 font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-2">
                Expiry Time (GMT)
              </label>
              <input
                type="time"
                value={expiryTime}
                onChange={(e) => setExpiryTime(e.target.value)}
                min={
                  expiryDate === minDateTime.split("T")[0]
                    ? minDateTime.split("T")[1]
                    : undefined
                }
                className="w-full bg-black/50 border-2 border-gray-600 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00FF88] focus:ring-2 focus:ring-[#00FF88]/20 transition-all cursor-pointer hover:border-gray-500 font-mono"
                required
              />
            </div>
          </div>

          {/* Stake Amount */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-2">
              Stake Amount (USDC)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                value={stake}
                onChange={(e) => setStake(e.target.value)}
                placeholder="100"
                className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00FF88]/50 font-mono"
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-mono">
                USDC
              </span>
            </div>
          </div>

          {/* Generated Condition Preview */}
          <div className="bg-black/40 border border-[#00FF88]/30 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-2">Prediction</p>
            <p className="text-sm text-gray-300 leading-relaxed break-words">
              {formatCondition()}
            </p>
          </div>

          {/* Approval Step */}
          {needsApproval && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <h4 className="text-xs font-bold text-yellow-400 mb-2">
                🔐 Approval Required
              </h4>
              <p className="text-xs text-yellow-300 mb-3 break-words">
                Approve USDC spending before creating the alpha.
              </p>
              <button
                type="button"
                onClick={handleApprove}
                disabled={isApproving}
                className="w-full bg-yellow-500 text-black font-bold py-3 rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-mono"
              >
                {isApproving ? "Approving..." : "Approve USDC"}
              </button>
            </div>
          )}

          {/* Transaction Status */}
          {createError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="text-red-400 text-sm break-words">
                Error: {createError.message || "Transaction failed"}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={
              !tokenData ||
              isCreating ||
              isConfirming ||
              isApproving ||
              needsApproval ||
              hasInsufficientBalance()
            }
            className="w-full bg-gradient-to-r from-[#00FF88] to-[#00AA55] text-black font-bold py-3 rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {isApproving
              ? "Approving USDC..."
              : isCreating
              ? "Confirm in Wallet..."
              : isConfirming
              ? "Creating Alpha..."
              : needsApproval
              ? "Approve USDC First"
              : "Create Alpha"}
          </button>
        </form>
      </Drawer>

      <Footer />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#1a1a1a",
            color: "#fff",
            border: "1px solid #333",
          },
        }}
      />
    </div>
  );
}
