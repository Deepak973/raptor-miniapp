"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAlphaList } from "../../lib/hooks";
import { formatTokenAmount, isExpired } from "../../lib/contract";
import { formatTimeET, getTimeUntilExpiryET } from "../../lib/tokenService";
import Link from "next/link";

export default function MyAlphasPage() {
  const { address, isConnected } = useAccount();
  const { data: allAlphas = [], isLoading } = useAlphaList(0, 100);
  const [myAlphas, setMyAlphas] = useState<
    Array<{
      alphaId: number;
      ticker: string;
      asset: string;
      tokenURI: string;
      creator: string;
      targetPrice: bigint;
      expiry: bigint;
      stake: bigint;
      totalStaked: bigint;
      totalOpponentsStaked: bigint;
      opponentCount: bigint;
      settled: boolean;
    }>
  >([]);
  const [filter, setFilter] = useState<
    "all" | "active" | "expired" | "settled"
  >("all");

  // Filter alphas created by the connected user
  useEffect(() => {
    if (allAlphas && address) {
      // Filter out uninitialized alphas first
      const validAlphas = allAlphas.filter(
        (alpha) =>
          alpha.expiry > BigInt(0) &&
          alpha.asset &&
          alpha.asset !== "0x0000000000000000000000000000000000000000"
      );

      const userAlphas = validAlphas
        .map((alpha, index) => {
          // Find the original index in the full alphas array
          const originalIndex = allAlphas.findIndex(
            (a) =>
              a.asset === alpha.asset &&
              a.expiry === alpha.expiry &&
              a.creator === alpha.creator &&
              a.stake === alpha.stake
          );
          return {
            ...alpha,
            alphaId: originalIndex >= 0 ? originalIndex : index,
          };
        })
        .filter(
          (alpha) => alpha.creator.toLowerCase() === address.toLowerCase()
        );
      setMyAlphas(userAlphas);
    }
  }, [allAlphas, address]);

  // Filter alphas based on status
  const filteredAlphas = myAlphas.filter((alpha) => {
    const isExpiredNow = isExpired(alpha.expiry);
    switch (filter) {
      case "active":
        return !alpha.settled && !isExpiredNow;
      case "expired":
        return !alpha.settled && isExpiredNow;
      case "settled":
        return alpha.settled;
      default:
        return true;
    }
  });

  const getStatusColor = (alpha: {
    alphaId: number;
    ticker: string;
    asset: string;
    tokenURI: string;
    creator: string;
    targetPrice: bigint;
    expiry: bigint;
    stake: bigint;
    totalStaked: bigint;
    totalOpponentsStaked: bigint;
    opponentCount: bigint;
    settled: boolean;
  }) => {
    const isExpiredNow = isExpired(alpha.expiry);
    if (alpha.settled) return "bg-blue-500";
    if (isExpiredNow) return "bg-yellow-500";
    return "bg-green-500 animate-pulse";
  };

  const getStatusText = (alpha: {
    alphaId: number;
    ticker: string;
    asset: string;
    tokenURI: string;
    creator: string;
    targetPrice: bigint;
    expiry: bigint;
    stake: bigint;
    totalStaked: bigint;
    totalOpponentsStaked: bigint;
    opponentCount: bigint;
    settled: boolean;
  }) => {
    const isExpiredNow = isExpired(alpha.expiry);
    if (alpha.settled) return "Settled";
    if (isExpiredNow) return "Expired";
    return "Active";
  };

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
              Please connect your wallet to view your alphas.
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

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            My Alphas
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Track your predictions and build your market credibility.
            <span className="text-[#00FF88] font-semibold">
              {" "}
              Your reputation is on the line.
            </span>
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="glass-panel rounded-2xl p-6 text-center">
            <div className="text-3xl font-bold text-[#00FF88] mb-2">
              {myAlphas.length}
            </div>
            <div className="text-gray-400">Total Alphas</div>
          </div>
          <div className="glass-panel rounded-2xl p-6 text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">
              {
                myAlphas.filter(
                  (alpha) => !alpha.settled && !isExpired(alpha.expiry)
                ).length
              }
            </div>
            <div className="text-gray-400">Active</div>
          </div>
          <div className="glass-panel rounded-2xl p-6 text-center">
            <div className="text-3xl font-bold text-yellow-400 mb-2">
              {
                myAlphas.filter(
                  (alpha) => !alpha.settled && isExpired(alpha.expiry)
                ).length
              }
            </div>
            <div className="text-gray-400">Expired</div>
          </div>
          <div className="glass-panel rounded-2xl p-6 text-center">
            <div className="text-3xl font-bold text-blue-400 mb-2">
              {myAlphas.filter((alpha) => alpha.settled).length}
            </div>
            <div className="text-gray-400">Settled</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {[
            { key: "all", label: "All Alphas", count: myAlphas.length },
            {
              key: "active",
              label: "Active",
              count: myAlphas.filter(
                (alpha) => !alpha.settled && !isExpired(alpha.expiry)
              ).length,
            },
            {
              key: "expired",
              label: "Expired",
              count: myAlphas.filter(
                (alpha) => !alpha.settled && isExpired(alpha.expiry)
              ).length,
            },
            {
              key: "settled",
              label: "Settled",
              count: myAlphas.filter((alpha) => alpha.settled).length,
            },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() =>
                setFilter(key as "all" | "active" | "expired" | "settled")
              }
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                filter === key
                  ? "bg-[#00FF88] text-black"
                  : "bg-black/40 text-gray-300 hover:bg-black/60"
              }`}
            >
              {label} ({count})
            </button>
          ))}
        </div>

        {/* Alphas Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full text-center py-12">
              <div className="flex justify-center mb-4">
                <img src="/alpha.png" alt="Loading" className="w-16 h-16" />
              </div>
              <p className="text-gray-400">Loading your alphas...</p>
            </div>
          ) : filteredAlphas.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="flex justify-center mb-4">
                <img src="/alpha.png" alt="No alphas" className="w-16 h-16" />
              </div>
              <h3 className="text-xl font-bold text-gray-400 mb-2">
                {filter === "all" ? "No Alphas Created" : `No ${filter} Alphas`}
              </h3>
              <p className="text-gray-500 mb-6">
                {filter === "all"
                  ? "You haven't created any alphas yet. Start building your credibility!"
                  : `You don't have any ${filter} alphas at the moment.`}
              </p>
              {filter === "all" && (
                <Link href="/create">
                  <button className="bg-gradient-to-r from-[#00FF88] to-[#00AA55] text-black font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-all">
                    Create Your First Alpha
                  </button>
                </Link>
              )}
            </div>
          ) : (
            filteredAlphas.map(
              (alpha: {
                alphaId: number;
                ticker: string;
                asset: string;
                tokenURI: string;
                creator: string;
                targetPrice: bigint;
                expiry: bigint;
                stake: bigint;
                totalStaked: bigint;
                totalOpponentsStaked: bigint;
                opponentCount: bigint;
                settled: boolean;
              }) => {
                const totalPool = Number(alpha.totalStaked);
                const creatorStake = Number(alpha.stake);
                const opponentCount = Number(alpha.opponentCount);
                const isExpiredNow = isExpired(alpha.expiry);

                return (
                  <div
                    key={alpha.alphaId}
                    className="glass-panel rounded-2xl p-6 glow-hover transition-all duration-300 hover:scale-[1.02]"
                  >
                    {/* Header with Token Info */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        {alpha.tokenURI ? (
                          <img
                            src={alpha.tokenURI}
                            alt={alpha.ticker}
                            className="w-12 h-12 rounded-full"
                          />
                        ) : (
                          <div className="text-4xl">🪙</div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h3 className="text-xl font-bold text-[#00FF88]">
                            {alpha.ticker}
                          </h3>
                          <p className="text-sm text-gray-400 font-mono break-all">
                            {alpha.asset}
                          </p>
                        </div>
                      </div>
                      <div className="text-right ml-4 flex-shrink-0">
                        <div className="text-xs text-gray-500 mb-1">
                          Your Stake
                        </div>
                        <div className="text-lg font-bold text-[#00FF88]">
                          ${formatTokenAmount(BigInt(creatorStake), 6)}
                        </div>
                      </div>
                    </div>

                    {/* Prediction */}
                    <div className="mb-4">
                      <p className="text-gray-300 text-sm leading-relaxed">
                        <span className="font-bold text-[#00FF88]">
                          {alpha.ticker}
                        </span>{" "}
                        will be trading{" "}
                        <span className="font-bold text-yellow-400">above</span>{" "}
                        <span className="font-bold text-white">
                          ${formatTokenAmount(alpha.targetPrice, 18)}
                        </span>{" "}
                        by{" "}
                        <span className="font-bold text-blue-400">
                          {formatTimeET(alpha.expiry)}
                        </span>
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-black/30 rounded-lg p-3">
                        <div className="text-xs text-gray-500 mb-1">Status</div>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`inline-block w-2 h-2 rounded-full ${getStatusColor(
                              alpha
                            )}`}
                          ></span>
                          <span className="text-sm font-bold text-white">
                            {getStatusText(alpha)}
                          </span>
                        </div>
                      </div>
                      <div className="bg-black/30 rounded-lg p-3">
                        <div className="text-xs text-gray-500 mb-1">
                          Expires In
                        </div>
                        <div className="text-sm font-bold text-[#00FF88]">
                          {isExpiredNow
                            ? "Expired"
                            : getTimeUntilExpiryET(alpha.expiry)}
                        </div>
                      </div>
                    </div>

                    {/* Betting Pool Info */}
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-gray-400 mb-2">
                        <span>
                          Total Pool: ${formatTokenAmount(BigInt(totalPool), 6)}
                        </span>
                        <span>Opponents: {opponentCount}/10</span>
                      </div>
                      <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-red-500 to-red-700 transition-all duration-300"
                          style={{
                            width: `${(opponentCount / 10) * 100}%`,
                          }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {opponentCount > 0
                          ? `${opponentCount} opponents betting against you`
                          : "No opponents yet"}
                      </div>
                    </div>

                    {/* Action Button */}
                    <Link href={`/alpha/${alpha.alphaId}`}>
                      <button className="w-full bg-[#00FF88]/10 hover:bg-[#00FF88]/20 text-[#00FF88] font-semibold py-3 px-4 rounded-xl border border-[#00FF88]/30 transition-all duration-300 hover:border-[#00FF88]/50">
                        View Details
                      </button>
                    </Link>
                  </div>
                );
              }
            )
          )}
        </div>

        {/* Create New Alpha CTA */}
        {myAlphas.length === 0 && (
          <div className="mt-16 text-center">
            <div className="glass-panel rounded-2xl p-8 max-w-2xl mx-auto">
              <div className="flex justify-center mb-6">
                <img
                  src="/alpha.png"
                  alt="Create Alpha"
                  className="w-20 h-20"
                />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                Start Building Your Credibility
              </h3>
              <p className="text-gray-400 mb-6">
                Create your first alpha prediction and stake your reputation.
                The market will judge your credibility based on your track
                record.
              </p>
              <Link href="/create">
                <button className="bg-gradient-to-r from-[#00FF88] to-[#00AA55] text-black font-bold px-8 py-4 rounded-xl hover:opacity-90 transition-all text-lg">
                  Create Your First Alpha
                </button>
              </Link>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
