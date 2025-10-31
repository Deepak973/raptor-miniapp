"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Toaster, toast } from "react-hot-toast";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { useAccount } from "wagmi";
import { useMiniApp } from "@neynar/react";
import {
  useAlpha,
  useAlphaOpponents,
  useIsAlphaResolved,
  useIsPriceRequested,
  useBetAgainst,
  useRequestAlphaSettlement,
  useFinalizeAlphaSettlement,
  useStakeTokenInfo,
  useUSDCBalance,
  useUserDetails,
  useSingleUserByAddress,
} from "../../../lib/hooks";
import { useTokenApprove } from "../../../hooks/useToken";
import {
  formatTokenAmount,
  formatAddress,
  isExpired,
  calculateRequiredStake,
} from "../../../lib/contract";
import { ALPHA_CONTRACT_ADDRESS } from "../../../lib/otherConstants";
import {
  fetchTokenDetails,
  formatTimeET,
  getTimeUntilExpiryET,
  TokenDetails,
} from "../../../lib/tokenService";
import { Drawer } from "../../../components/ui/Drawer";
import { CopyButton } from "../../../components/ui/CopyButton";
import { ShareButton } from "../../../components/ui/Share";

export default function AlphaDetails() {
  const params = useParams();
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { context } = useMiniApp();
  const bettorFid = context?.user?.fid || 0;
  const [timeLeft, setTimeLeft] = useState("");
  const [needsApproval, setNeedsApproval] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState("");
  const [betDrawerOpen, setBetDrawerOpen] = useState(false);

  const alphaId = parseInt(params.id as string);

  // Contract data hooks
  const { data: alpha, isLoading: alphaLoading } = useAlpha(alphaId);
  const { data: opponents } = useAlphaOpponents(alphaId);

  // Get opponents array with proper typing
  interface Opponent {
    addr: string;
    amount: bigint;
    fid: bigint;
  }
  // Filter out invalid opponents (zero address or zero amount)
  const rawOpponents = (opponents as unknown as Opponent[]) || [];
  const opponentsList = rawOpponents.filter(
    (opp) =>
      opp.addr &&
      opp.addr !== "0x0000000000000000000000000000000000000000" &&
      opp.amount > BigInt(0)
  );

  // Get FIDs for opponents only (from contract)
  const opponentFids = opponentsList
    .map((opp) => {
      const fid = opp.fid !== undefined ? Number(opp.fid) : 0;
      return fid;
    })
    .filter((fid) => fid > 0);

  // Fetch user details for opponents by FID
  const { data: opponentUsers = [] } = useUserDetails({
    fids: opponentFids,
    enabled: opponentFids.length > 0,
  });

  // Create a map of FID to user details for opponents
  const fidToUser = new Map(opponentUsers.map((user) => [user.fid, user]));

  // Fetch creator user details by address
  const { data: creatorUser } = useSingleUserByAddress(alpha?.creator);
  const { data: isResolved } = useIsAlphaResolved(alphaId);
  const { data: isPriceRequested } = useIsPriceRequested(alphaId);
  const { data: stakeTokenInfo } = useStakeTokenInfo();
  const { balance: usdcBalance, decimals: usdcDecimals } = useUSDCBalance();
  const [tokenDetails, setTokenDetails] = useState<TokenDetails | null>(null);

  // Use useTokenApprove hook
  const {
    allowance: tokenAllowance,
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
      toast.success("USDC approved! You can now place your bet. ✅");
      fetchAllowance();
    },
    onError: (err) => {
      toast.dismiss();
      toast.error(
        err instanceof Error ? err.message : "Failed to approve USDC"
      );
    },
  });

  // Contract interaction hooks
  const {
    betAgainst,
    isPending: isBetting,
    isConfirming: isBetConfirming,
    isSuccess: isBetSuccess,
    error: betError,
  } = useBetAgainst();
  const {
    requestAlphaSettlement,
    isPending: isRequesting,
    isConfirming: isRequestConfirming,
    isSuccess: isRequestSuccess,
    error: requestError,
  } = useRequestAlphaSettlement();
  const {
    finalizeAlphaSettlement,
    isPending: isFinalizing,
    isConfirming: isFinalizeConfirming,
    isSuccess: isFinalizeSuccess,
    error: finalizeError,
  } = useFinalizeAlphaSettlement();

  // Calculate time left and remaining time
  useEffect(() => {
    if (!alpha) return;

    const calculateTimeLeft = () => {
      setTimeLeft(getTimeUntilExpiryET(alpha.expiry));

      const now = BigInt(Math.floor(Date.now() / 1000));
      const expiry = alpha.expiry;
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeRemaining("Expired");
      } else {
        const days = Number(diff) / (24 * 60 * 60);
        const hours = (Number(diff) % (24 * 60 * 60)) / (60 * 60);
        const minutes = (Number(diff) % (60 * 60)) / 60;
        const seconds = Number(diff) % 60;

        if (days >= 1) {
          setTimeRemaining(
            `${Math.floor(days)}d ${Math.floor(hours)}h ${Math.floor(
              minutes
            )}m ${Math.floor(seconds)}s`
          );
        } else if (hours >= 1) {
          setTimeRemaining(
            `${Math.floor(hours)}h ${Math.floor(minutes)}m ${Math.floor(
              seconds
            )}s`
          );
        } else if (minutes >= 1) {
          setTimeRemaining(`${Math.floor(minutes)}m ${Math.floor(seconds)}s`);
        } else {
          setTimeRemaining(`${Math.floor(seconds)}s`);
        }
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [alpha]);

  // Fetch token details
  useEffect(() => {
    if (alpha?.asset) {
      fetchTokenDetails(alpha.asset).then(setTokenDetails);
    }
  }, [alpha?.asset, alpha?.tokenURI, alpha?.ticker]);

  // Check if user needs approval
  useEffect(() => {
    if (alpha && stakeTokenInfo && address && tokenAllowance !== undefined) {
      const requiredStake = calculateRequiredStake(alpha.stake);
      const hasEnoughAllowance = tokenAllowance >= requiredStake;
      setNeedsApproval(!hasEnoughAllowance);
    }
  }, [alpha, stakeTokenInfo, address, tokenAllowance]);

  // Re-check approval status after approval
  useEffect(() => {
    if (
      !isApproving &&
      alpha &&
      stakeTokenInfo &&
      address &&
      tokenAllowance !== undefined
    ) {
      const requiredStake = calculateRequiredStake(alpha.stake);
      const hasEnoughAllowance = tokenAllowance >= requiredStake;
      setNeedsApproval(!hasEnoughAllowance);
    }
  }, [isApproving, alpha, stakeTokenInfo, address, tokenAllowance]);

  // Close drawer on successful bet
  useEffect(() => {
    if (isBetSuccess) {
      setBetDrawerOpen(false);
    }
  }, [isBetSuccess]);

  const handleBetAgainst = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!alpha) return;

    if (needsApproval) {
      toast.error("Please approve USDC spending first");
      return;
    }

    toast.promise(betAgainst(alphaId, bettorFid), {
      loading: "Placing your bet...",
      success: "Bet placed successfully!",
      error: "Failed to place bet. Please try again.",
    });
  };

  const handleRequestSettlement = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    toast.promise(requestAlphaSettlement(alphaId), {
      loading: "Requesting settlement from UMA...",
      success: "Settlement requested! Waiting for UMA resolution...",
      error: "Failed to request settlement. Please try again.",
    });
  };

  const handleFinalizeSettlement = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    toast.promise(finalizeAlphaSettlement(alphaId), {
      loading: "Finalizing settlement...",
      success: "Alpha settled successfully!",
      error: "Failed to finalize settlement. Please try again.",
    });
  };

  const handleApprove = async () => {
    if (!stakeTokenInfo || !alpha) return;
    const requiredStake = calculateRequiredStake(alpha.stake);
    await approve(requiredStake);
  };

  if (alphaLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🦖</div>
          <p className="text-gray-400 font-mono">Loading alpha...</p>
        </div>
      </div>
    );
  }

  if (!alpha) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <p className="text-gray-400 font-mono">Alpha not found</p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 text-[#00FF88] hover:underline font-mono"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const totalPool = Number(alpha.totalStaked);
  const creatorStake = Number(alpha.stake);
  const opponentStake = Number(alpha.totalOpponentsStaked);
  const opponentCount = Number(alpha.opponentCount);
  const maxOpponents = 10;
  const availablePositions = maxOpponents - opponentCount;
  const requiredStake = Number(calculateRequiredStake(alpha.stake));

  const isExpiredNow = isExpired(alpha.expiry);
  const isCreator = address?.toLowerCase() === alpha.creator.toLowerCase();
  const isBettor = opponentsList.some(
    (opp) => opp.addr.toLowerCase() === address?.toLowerCase()
  );
  const canShare = isCreator || isBettor;
  const canBet =
    !alpha.settled && !isExpiredNow && availablePositions > 0 && !isCreator;
  const priceRequested = Boolean(isPriceRequested);
  const canRequestSettlement =
    !alpha.settled && isExpiredNow && !priceRequested;

  const currentPrice = tokenDetails?.price_usd || 0;
  const targetPrice = Number(formatTokenAmount(alpha.targetPrice, 18));
  const priceDiff = targetPrice - currentPrice;
  const priceDiffPercent =
    currentPrice > 0 ? (priceDiff / currentPrice) * 100 : 0;

  // GeckoTerminal chart URL - try different formats
  const chartUrl = alpha.asset
    ? `https://www.geckoterminal.com/base/tokens/${alpha.asset}?embed=1&info=0&swaps=0&light_chart=1&chart_type=price&resolution=1h&bg_color=0b0b0b`
    : null;

  // Alternative: try pool chart if token chart doesn't work
  // Format: https://www.geckoterminal.com/base/pools/{pool_address}?embed=1&info=0&swaps=0&light_chart=1&chart_type=market_cap&resolution=1d&bg_color=0b0b0b

  return (
    <div className="min-h-screen flex flex-col pb-20 md:pb-0">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8 lg:py-12 w-full">
        {/* Back Button */}
        <button
          onClick={() => router.push("/alphas")}
          className="mb-4 sm:mb-6 text-gray-400 hover:text-[#00FF88] transition-colors flex items-center space-x-2 text-sm sm:text-base font-mono"
        >
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span>Back</span>
        </button>

        {/* Header Card - Simplified */}
        <div className="glass-panel rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-0">
            <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
              <div className="flex-shrink-0">
                {tokenDetails?.image_url ? (
                  <img
                    src={tokenDetails.image_url}
                    alt={tokenDetails.symbol}
                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 border-[#00FF88]/30"
                  />
                ) : (
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[#00FF88]/20 flex items-center justify-center text-2xl sm:text-3xl">
                    🪙
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 sm:gap-3 mb-1 flex-wrap">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#00FF88] break-words font-mono">
                    {alpha.ticker}
                  </h1>
                  {/* Live Timer */}
                  <div className="inline-flex items-center space-x-2 bg-black/60 border border-[#00FF88]/30 px-2 sm:px-3 py-1 rounded-lg">
                    {isExpiredNow ? (
                      <span className="text-xs sm:text-sm font-bold text-yellow-400 font-mono">
                        Expired
                      </span>
                    ) : (
                      <span className="text-xs sm:text-sm font-bold text-[#00FF88] font-mono">
                        {timeRemaining}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-gray-400 font-mono text-xs sm:text-sm break-all">
                    {alpha.asset.slice(0, 4)}...{alpha.asset.slice(-4)}
                  </p>
                  <CopyButton text={alpha.asset} />
                </div>
                <div className="inline-flex items-center space-x-2 bg-black/40 px-2 sm:px-3 py-1 rounded-lg">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      alpha.settled
                        ? "bg-blue-500"
                        : isExpiredNow
                        ? "bg-yellow-500"
                        : "bg-green-500 animate-pulse"
                    }`}
                  ></span>
                  <span className="text-xs sm:text-sm font-semibold text-white">
                    {alpha.settled
                      ? "Settled"
                      : isExpiredNow
                      ? "Expired"
                      : "Active"}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-left md:text-right">
              <p className="text-xs sm:text-sm text-gray-500 mb-1 font-mono">
                Total Pool
              </p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#00FF88] break-words font-mono">
                ${formatTokenAmount(BigInt(totalPool), 6).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Price Comparison - Prominent Display */}
        <div className="glass-panel rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
            {/* Current Price */}
            <div className="bg-black/40 rounded-xl p-4 sm:p-6 border-2 border-[#00FF88]/20">
              <p className="text-xs sm:text-sm text-gray-400 mb-2 font-mono">
                Current Price
              </p>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#00FF88] mb-2 font-mono">
                {tokenDetails
                  ? `$${tokenDetails.price_usd.toFixed(6)}`
                  : "Loading..."}
              </p>
              {tokenDetails && (
                <p className="text-xs text-gray-500 font-mono">
                  Live from GeckoTerminal
                </p>
              )}
            </div>

            {/* Target Price */}
            <div className="bg-black/40 rounded-xl p-4 sm:p-6 border-2 border-yellow-500/20">
              <p className="text-xs sm:text-sm text-gray-400 mb-2 font-mono">
                Target Price
              </p>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-yellow-400 mb-2 font-mono">
                ${targetPrice.toFixed(6)}
              </p>
              <p className="text-xs text-gray-500 font-mono">
                Prediction threshold
              </p>
            </div>
          </div>

          {/* Price Gap Visualization */}
          {tokenDetails && (
            <div className="bg-black/40 rounded-xl p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-400 font-mono">
                  Price Gap
                </span>
                <span
                  className={`text-lg sm:text-xl font-bold font-mono ${
                    priceDiff >= 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {priceDiff >= 0 ? "+" : ""}
                  {priceDiff.toFixed(6)} ({priceDiffPercent >= 0 ? "+" : ""}
                  {priceDiffPercent.toFixed(2)}%)
                </span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    priceDiff >= 0 ? "bg-green-500" : "bg-red-500"
                  }`}
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(0, (currentPrice / targetPrice) * 100)
                    )}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-2 font-mono">
                <span>$0</span>
                <span>Target: ${targetPrice.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Chart Section */}
        {chartUrl && (
          <div className="glass-panel rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 overflow-hidden">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-4 font-mono">
              Price Chart
            </h2>
            <div className="relative w-full" style={{ height: "400px" }}>
              <iframe
                id="geckoterminal-embed"
                title="GeckoTerminal Embed"
                src={chartUrl}
                frameBorder="0"
                allow="clipboard-write"
                allowFullScreen
                className="w-full h-full rounded-lg"
              />
            </div>
          </div>
        )}

        {/* Key Info Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="glass-panel rounded-xl p-3 sm:p-4">
            <p className="text-xs text-gray-500 mb-1 font-mono">Creator</p>
            {creatorUser ? (
              <div className="flex items-center gap-2 mb-1">
                {creatorUser.pfp_url && (
                  <img
                    src={creatorUser.pfp_url}
                    alt={creatorUser.display_name || creatorUser.username}
                    className="w-5 h-5 rounded-full"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white">
                    {creatorUser.display_name || creatorUser.username}
                  </p>
                  <p className="text-xs text-gray-500">
                    @{creatorUser.username}
                  </p>
                </div>
              </div>
            ) : null}
            <div className="flex items-center gap-2">
              <p className="text-xs sm:text-sm font-mono text-[#00FF88] break-all">
                {formatAddress(alpha.creator)}
              </p>
              <CopyButton text={alpha.creator} />
            </div>
          </div>
          <div className="glass-panel rounded-xl p-3 sm:p-4">
            <p className="text-xs text-gray-500 mb-1 font-mono">Expires</p>
            <p className="text-xs sm:text-sm font-bold text-[#00FF88] break-words font-mono">
              {timeLeft}
            </p>
          </div>
          <div className="glass-panel rounded-xl p-3 sm:p-4">
            <p className="text-xs text-gray-500 mb-1 font-mono">Stake</p>
            <p className="text-xs sm:text-sm font-bold text-white break-words font-mono">
              ${formatTokenAmount(BigInt(creatorStake), 6)}
            </p>
          </div>
          <div className="glass-panel rounded-xl p-3 sm:p-4">
            <p className="text-xs text-gray-500 mb-1 font-mono">Bet Amount</p>
            <p className="text-xs sm:text-sm font-bold text-red-400 break-words font-mono">
              ${formatTokenAmount(BigInt(requiredStake), 6)}
            </p>
          </div>
        </div>

        {/* Betting Pool Info */}
        <div className="glass-panel rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-4 font-mono">
            Betting Pool
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-[#00FF88] rounded-full"></div>
                <span className="text-sm text-gray-300">Creator</span>
              </div>
              <span className="text-lg font-bold text-[#00FF88] font-mono">
                ${formatTokenAmount(BigInt(creatorStake), 6)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm text-gray-300">Opponents</span>
              </div>
              <span className="text-lg font-bold text-red-400 font-mono">
                ${formatTokenAmount(BigInt(opponentStake), 6)} ({opponentCount}
                /10)
              </span>
            </div>
            <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-500 to-red-700 transition-all duration-500"
                style={{
                  width: `${(opponentCount / maxOpponents) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Opponents Table */}
          {opponentsList.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-700">
              <h3 className="text-sm font-bold text-gray-300 mb-3 font-mono">
                Opponents ({opponentsList.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left text-xs text-gray-400 font-mono py-2">
                        User
                      </th>
                      <th className="text-left text-xs text-gray-400 font-mono py-2">
                        Address
                      </th>
                      <th className="text-right text-xs text-gray-400 font-mono py-2">
                        Stake
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {opponentsList.map((opponent, index) => {
                      const isCurrentUser =
                        address?.toLowerCase() === opponent.addr.toLowerCase();
                      const opponentFid = Number(opponent.fid);
                      const opponentUser =
                        opponentFid > 0 ? fidToUser.get(opponentFid) : null;
                      return (
                        <tr
                          key={index}
                          className={`border-b border-gray-800/50 ${
                            isCurrentUser ? "bg-red-500/10" : ""
                          }`}
                        >
                          <td className="py-2">
                            <div className="flex items-center gap-2">
                              {opponentUser?.pfp_url ? (
                                <img
                                  src={opponentUser.pfp_url}
                                  alt={
                                    opponentUser.display_name ||
                                    opponentUser.username
                                  }
                                  className="w-6 h-6 rounded-full"
                                />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-gray-700"></div>
                              )}
                              <div>
                                <p className="text-xs font-semibold text-white">
                                  {opponentUser?.display_name ||
                                    opponentUser?.username ||
                                    `FID ${opponentFid}`}
                                </p>
                                {opponentUser && (
                                  <p className="text-xs text-gray-500">
                                    @{opponentUser.username}
                                  </p>
                                )}
                              </div>
                              {isCurrentUser && (
                                <span className="text-xs text-red-400 font-semibold">
                                  (You)
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono text-gray-300">
                                {formatAddress(opponent.addr)}
                              </span>
                              <CopyButton
                                text={opponent.addr}
                                className="flex-shrink-0"
                              />
                            </div>
                          </td>
                          <td className="py-2 text-right">
                            <span className="text-xs font-bold text-red-400 font-mono">
                              ${formatTokenAmount(BigInt(opponent.amount), 6)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Prediction Text */}
        <div className="glass-panel rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-white font-mono">
              Prediction
            </h2>
            {/* Share Button - Only for Creator and Betters */}
            {canShare && (
              <div className="flex-shrink-0">
                <ShareButton
                  buttonText="Share"
                  cast={{
                    text: `🦖 ${
                      alpha.ticker
                    } will be trading above $${formatTokenAmount(
                      alpha.targetPrice,
                      18
                    )} by ${formatTimeET(
                      alpha.expiry
                    )}\n\nChallenge this prediction on RAPTOR! 🚀`,
                    embeds: [
                      {
                        path: `/alpha/${alphaId}`,
                      },
                    ],
                  }}
                  className="!px-4 !py-2 !text-xs !bg-[#00FF88]/20 !text-[#00FF88] !border !border-[#00FF88]/50 hover:!bg-[#00FF88]/30 transition-colors rounded-lg font-mono !w-auto !max-w-none !mx-0"
                />
              </div>
            )}
          </div>
          <p className="text-gray-300 text-sm sm:text-base leading-relaxed break-words">
            <span className="font-bold text-[#00FF88]">{alpha.ticker}</span>{" "}
            will be trading{" "}
            <span className="font-bold text-yellow-400">above</span>{" "}
            <span className="font-bold text-white">
              ${formatTokenAmount(alpha.targetPrice, 18)}
            </span>{" "}
            by{" "}
            <span className="font-bold text-blue-400 break-words">
              {formatTimeET(alpha.expiry)}
            </span>
          </p>
        </div>

        {/* Action Button - Opens Drawer */}
        {canBet && (
          <div className="mb-6 sm:mb-8">
            <button
              onClick={() => setBetDrawerOpen(true)}
              className="w-full bg-gradient-to-r from-red-500 to-red-700 text-white font-bold py-3 sm:py-4 px-6 rounded-xl hover:opacity-90 transition-all text-sm sm:text-base font-mono"
            >
              Bet Against ({availablePositions} positions left)
            </button>
          </div>
        )}

        {/* Request Settlement Section */}
        {canRequestSettlement && (
          <div className="glass-panel rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-blue-500/30 mb-6 sm:mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <img src="/uma.png" alt="UMA" className="w-8 h-8" />
              <h3 className="text-lg sm:text-xl font-bold text-blue-400 font-mono">
                Request UMA Settlement
              </h3>
            </div>
            <div className="space-y-4">
              <p className="text-yellow-300 text-sm break-words">
                ⏰ This alpha has expired. Request settlement from UMA Oracle.
              </p>
              {requestError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <p className="text-red-400 text-xs break-words">
                    Error: {requestError.message || "Request failed"}
                  </p>
                </div>
              )}
              {isRequestSuccess && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                  <p className="text-green-400 text-xs break-words">
                    ✅ Settlement requested! Check status below.
                  </p>
                </div>
              )}
              <button
                onClick={handleRequestSettlement}
                disabled={isRequesting || isRequestConfirming}
                className="w-full bg-blue-500 text-white font-bold py-3 rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm font-mono"
              >
                <img src="/uma.png" alt="UMA" className="w-5 h-5" />
                <span>
                  {isRequesting
                    ? "Confirm in Wallet..."
                    : isRequestConfirming
                    ? "Requesting..."
                    : "Request Settlement"}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Check Status / Finalize Settlement Section */}
        {priceRequested && !alpha.settled && (
          <div className="glass-panel rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-blue-500/30 mb-6 sm:mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <img src="/uma.png" alt="UMA" className="w-8 h-8" />
              <h3 className="text-lg sm:text-xl font-bold text-blue-400 font-mono">
                UMA Settlement Status
              </h3>
            </div>
            <div className="space-y-4">
              {isResolved === true ? (
                <>
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                    <p className="text-green-400 text-xs break-words">
                      ✅ UMA has resolved the price. You can now finalize the
                      settlement.
                    </p>
                  </div>
                  {finalizeError && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                      <p className="text-red-400 text-xs break-words">
                        Error: {finalizeError.message || "Finalization failed"}
                      </p>
                    </div>
                  )}
                  {isFinalizeSuccess && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                      <p className="text-green-400 text-xs break-words">
                        ✅ Alpha settled successfully!
                      </p>
                    </div>
                  )}
                  <button
                    onClick={handleFinalizeSettlement}
                    disabled={isFinalizing || isFinalizeConfirming}
                    className="w-full bg-green-500 text-white font-bold py-3 rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm font-mono"
                  >
                    <img src="/uma.png" alt="UMA" className="w-5 h-5" />
                    <span>
                      {isFinalizing
                        ? "Confirm in Wallet..."
                        : isFinalizeConfirming
                        ? "Finalizing..."
                        : "Finalize Settlement"}
                    </span>
                  </button>
                </>
              ) : (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                  <p className="text-yellow-300 text-xs break-words">
                    ⏳ Waiting for UMA Oracle to resolve the price. Check back
                    soon.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Creator Warning */}
        {isCreator && !isExpiredNow && (
          <div className="glass-panel rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-yellow-500/30 mb-6 sm:mb-8">
            <p className="text-yellow-300 text-sm break-words">
              ℹ️ You are the creator of this alpha. Creators cannot bet against
              their own predictions.
            </p>
          </div>
        )}
      </main>

      {/* Bet Drawer */}
      <Drawer
        isOpen={betDrawerOpen}
        onClose={() => setBetDrawerOpen(false)}
        title="Bet Against Alpha"
      >
        <div className="space-y-4">
          {/* USDC Balance & Required Stake */}
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-300">
                  Your USDC Balance:
                </span>
                <span className="text-sm font-bold text-[#00FF88]">
                  $
                  {usdcBalance
                    ? formatTokenAmount(usdcBalance, usdcDecimals)
                    : "0.00"}{" "}
                  USDC
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-300">Required Stake:</span>
                <span className="text-sm font-bold text-red-400">
                  ${formatTokenAmount(BigInt(requiredStake), usdcDecimals)} USDC
                </span>
              </div>
              {usdcBalance && usdcBalance < requiredStake && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-2 mt-2">
                  <p className="text-xs text-yellow-300 break-words">
                    ⚠️ Insufficient USDC balance
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Available Positions */}
          <div className="bg-black/40 rounded-lg p-3">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Available Positions:</span>
              <span className="text-red-400 font-semibold">
                {availablePositions} / {maxOpponents}
              </span>
            </div>
          </div>

          {/* Approval Step */}
          {needsApproval && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <h4 className="text-xs font-bold text-yellow-400 mb-2">
                🔐 Approval Required
              </h4>
              <p className="text-xs text-yellow-300 mb-3 break-words">
                Approve USDC spending before betting.
              </p>
              {!needsApproval && !isApproving && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-3">
                  <p className="text-green-400 text-sm break-words">
                    ✅ USDC approved!
                  </p>
                </div>
              )}
              <button
                onClick={handleApprove}
                disabled={isApproving || !needsApproval}
                className="w-full bg-yellow-500 text-black font-bold py-2.5 rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isApproving ? "Approving..." : "Approve USDC"}
              </button>
            </div>
          )}

          {/* Transaction Status */}
          {betError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="text-red-400 text-sm break-words">
                Error: {betError.message || "Transaction failed"}
              </p>
            </div>
          )}

          {isBetSuccess && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <p className="text-green-400 text-sm break-words">
                ✅ Bet placed successfully!
              </p>
            </div>
          )}

          {/* Place Bet Button */}
          <button
            onClick={handleBetAgainst}
            disabled={
              !isConnected ||
              isBetting ||
              isBetConfirming ||
              needsApproval ||
              (usdcBalance !== undefined && usdcBalance < requiredStake)
            }
            className={`w-full font-bold py-3 px-4 rounded-xl transition-all text-sm ${
              !isConnected ||
              isBetting ||
              isBetConfirming ||
              needsApproval ||
              (usdcBalance !== undefined && usdcBalance < requiredStake)
                ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-red-500 to-red-700 text-white hover:opacity-90"
            }`}
          >
            {!isConnected
              ? "Connect Wallet"
              : isBetting
              ? "Confirm in Wallet..."
              : isBetConfirming
              ? "Placing Bet..."
              : needsApproval
              ? "Approve USDC First"
              : usdcBalance && usdcBalance < requiredStake
              ? "Insufficient USDC"
              : `Bet Against (${availablePositions} left)`}
          </button>

          <div className="text-xs text-gray-500 text-center space-y-1 break-words">
            <p>
              If you win, you&apos;ll receive a proportional share of the pool
            </p>
            <p className="font-mono">
              Potential ROI:{" "}
              {opponentCount > 0
                ? (
                    (totalPool / (opponentCount + 1) / requiredStake) *
                    100
                  ).toFixed(1)
                : 0}
              %
            </p>
          </div>
        </div>
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
