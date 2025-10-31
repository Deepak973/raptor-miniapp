"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAccount } from "wagmi";
import {
  useWithdrawableAmount,
  useWithdraw,
  useStakeTokenInfo,
  useUserBets,
  useAlpha,
  useUserStakeInAlpha,
} from "../../lib/hooks";
import Link from "next/link";
import { formatTokenAmount } from "../../lib/contract";

export default function WithdrawPage() {
  const { address, isConnected } = useAccount();
  const { data: withdrawableAmount = BigInt(0), isLoading: amountLoading } =
    useWithdrawableAmount();
  const { data: stakeTokenInfo } = useStakeTokenInfo();
  const { withdraw, isPending, isConfirming, isSuccess, error } = useWithdraw();
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const { data: userBetsData } = useUserBets(address || "");

  // Convert userBets to array of alpha IDs
  const userBetIds = useMemo(() => {
    if (!userBetsData) return [];
    try {
      // Handle both array and bigint[] formats
      const bets = Array.isArray(userBetsData)
        ? userBetsData
        : (userBetsData as unknown as bigint[]);
      return bets.map((id) => Number(id)).filter((id) => !isNaN(id) && id >= 0);
    } catch {
      return [];
    }
  }, [userBetsData]);

  const handleWithdraw = async () => {
    if (withdrawableAmount <= 0) return;

    setIsWithdrawing(true);
    try {
      await withdraw();
    } catch (err) {
      console.error("Withdrawal failed:", err);
    } finally {
      setIsWithdrawing(false);
    }
  };

  const formattedAmount = stakeTokenInfo
    ? formatTokenAmount(withdrawableAmount, stakeTokenInfo.decimals)
    : "0";

  if (!isConnected) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4">
              Connect Wallet
            </h1>
            <p className="text-gray-400 mb-8">
              Please connect your wallet to view withdrawable amounts.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="relative w-12 h-12">
              <Image
                src="/logo.png"
                alt="RAPTOR Logo"
                fill
                className="object-contain"
              />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00FF88] to-[#00AA55]">
              Withdraw Funds
            </h1>
          </div>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Withdraw your winnings from successful alpha predictions.
          </p>
        </div>

        {/* Withdrawal Card */}
        <div className="glass-panel rounded-2xl p-8 max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-[#00FF88] mb-4">
              Withdrawable Balance
            </h2>

            {amountLoading ? (
              <div className="text-4xl font-bold text-gray-400 mb-2">
                Loading...
              </div>
            ) : (
              <div className="text-4xl font-bold text-white mb-2">
                {formattedAmount} USDC
              </div>
            )}

            <p className="text-gray-400">Available for withdrawal</p>
          </div>

          {/* Withdrawal Button */}
          <div className="space-y-4">
            {withdrawableAmount > 0 ? (
              <button
                onClick={handleWithdraw}
                disabled={isPending || isConfirming || isWithdrawing}
                className="w-full bg-gradient-to-r from-[#00FF88] to-[#00AA55] text-black font-bold py-4 rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending
                  ? "Confirm in Wallet..."
                  : isConfirming
                  ? "Processing..."
                  : isWithdrawing
                  ? "Withdrawing..."
                  : "Withdraw Funds"}
              </button>
            ) : (
              <div className="text-center py-8">
                <div className="flex justify-center mb-4">
                  <img
                    src="/trophy.webp"
                    alt="No Funds"
                    className="w-16 h-16"
                  />
                </div>
                <h3 className="text-xl font-bold text-gray-400 mb-2">
                  No Funds Available
                </h3>
                <p className="text-gray-500">
                  You don&apos;t have any withdrawable funds at the moment.
                </p>
              </div>
            )}

            {/* Transaction Status */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <p className="text-red-400 text-sm">
                  Error: {error.message || "Transaction failed"}
                </p>
              </div>
            )}

            {isSuccess && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <p className="text-green-400 text-sm">
                  ✅ Withdrawal successful! Your funds have been transferred to
                  your wallet.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Bet History Section */}
        {userBetIds.length > 0 && (
          <div className="mt-12 glass-panel rounded-2xl p-6 max-w-4xl mx-auto">
            <h3 className="text-lg font-bold text-[#00FF88] mb-4 font-mono">
              Your Bet History
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {userBetIds.map((alphaId) => (
                <AlphaBetCard
                  key={alphaId}
                  alphaId={alphaId}
                  address={address || ""}
                />
              ))}
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-12 glass-panel rounded-2xl p-6 max-w-2xl mx-auto">
          <h3 className="text-lg font-bold text-[#00FF88] mb-4">
            How Withdrawals Work
          </h3>
          <div className="space-y-4 text-sm text-gray-400">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-[#00FF88] rounded-full mt-2"></div>
              <div>
                <h4 className="text-white font-semibold">Winning Alphas</h4>
                <p>
                  When you win an alpha prediction, your winnings are
                  automatically added to your withdrawable balance.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-[#00FF88] rounded-full mt-2"></div>
              <div>
                <h4 className="text-white font-semibold">Instant Withdrawal</h4>
                <p>
                  You can withdraw your funds at any time. There are no lock-up
                  periods or waiting times.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-[#00FF88] rounded-full mt-2"></div>
              <div>
                <h4 className="text-white font-semibold">USDC Tokens</h4>
                <p>
                  All withdrawals are made in USDC tokens directly to your
                  connected wallet address.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

// Component to display individual alpha bet card
function AlphaBetCard({
  alphaId,
  address,
}: {
  alphaId: number;
  address: string;
}) {
  const { data: alpha, isLoading } = useAlpha(alphaId);
  const { data: userStake } = useUserStakeInAlpha(alphaId, address);

  if (isLoading) {
    return (
      <div className="glass-panel rounded-lg p-4">
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    );
  }

  if (!alpha) {
    return (
      <div className="glass-panel rounded-lg p-4">
        <p className="text-gray-400 text-sm">Alpha #{alphaId} not found</p>
      </div>
    );
  }

  const isCreator = address.toLowerCase() === alpha.creator.toLowerCase();
  const stakeAmount = Number(userStake || BigInt(0));
  const isExpired = Number(alpha.expiry) <= Math.floor(Date.now() / 1000);

  return (
    <Link href={`/alpha/${alphaId}`}>
      <div className="glass-panel rounded-lg p-4 hover:bg-black/40 transition-colors cursor-pointer">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="text-base font-bold text-[#00FF88] font-mono">
                {alpha.ticker}
              </h4>
              <span
                className={`text-xs px-2 py-0.5 rounded ${
                  alpha.settled
                    ? "bg-blue-500/20 text-blue-400"
                    : isExpired
                    ? "bg-yellow-500/20 text-yellow-400"
                    : "bg-green-500/20 text-green-400"
                } font-mono`}
              >
                {alpha.settled ? "Settled" : isExpired ? "Expired" : "Active"}
              </span>
              {isCreator && (
                <span className="text-xs px-2 py-0.5 rounded bg-[#00FF88]/20 text-[#00FF88] font-mono">
                  Creator
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 font-mono mb-2 break-all">
              {alpha.asset.slice(0, 6)}...{alpha.asset.slice(-4)}
            </p>
            <div className="flex items-center gap-4 text-xs">
              <div>
                <span className="text-gray-500">Your Stake: </span>
                <span className="text-[#00FF88] font-bold font-mono">
                  ${formatTokenAmount(BigInt(stakeAmount), 6)}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Pool: </span>
                <span className="text-white font-mono">
                  ${formatTokenAmount(BigInt(Number(alpha.totalStaked)), 6)}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-gray-500 mb-1 font-mono">Alpha ID</p>
            <p className="text-sm font-bold text-gray-300 font-mono">
              #{alphaId}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
