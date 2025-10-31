"use client";

import Link from "next/link";
import { Alpha } from "../../lib/contract";
import { useEffect, useState } from "react";
import {
  formatTokenAmount,
  getTimeUntilExpiry,
  isExpired,
} from "../../lib/contract";

interface AlphaCardProps {
  alpha: Alpha;
  alphaId: number;
}

// Helper to truncate token address to 3-4 letters
const truncateTokenAddress = (address: string): string => {
  if (!address) return "";
  return `${address.slice(0, 4)}...${address.slice(-3)}`;
};

export default function AlphaCard({ alpha, alphaId }: AlphaCardProps) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const calculateTimeLeft = () => {
      setTimeLeft(getTimeUntilExpiry(alpha.expiry));
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 60000);

    return () => clearInterval(timer);
  }, [alpha.expiry]);

  const availablePositions = 10 - Number(alpha.opponentCount);
  const totalPool = Number(alpha.totalStaked);
  const creatorStake = Number(alpha.stake);
  const requiredStake = Math.round(creatorStake * 0.1);
  const isExpiredNow = isExpired(alpha.expiry);

  return (
    <Link href={`/alpha/${alphaId}`}>
      <div className="glass-panel rounded-xl sm:rounded-2xl p-4 sm:p-6 glow-hover transition-all duration-300 hover:scale-[1.02] cursor-pointer h-full flex flex-col">
        {/* Header with Token Info */}
        <div className="flex items-start justify-between mb-3 sm:mb-4 gap-3">
          <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
            {alpha.tokenURI ? (
              <img
                src={alpha.tokenURI}
                alt={alpha.ticker}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex-shrink-0"
              />
            ) : (
              <div className="text-3xl sm:text-4xl flex-shrink-0">🪙</div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="text-lg sm:text-xl font-bold text-[#00FF88] mb-1 break-words">
                {alpha.ticker}
              </h3>
              <p className="text-xs sm:text-sm text-gray-400 font-mono break-all">
                {truncateTokenAddress(alpha.asset)}
              </p>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-xs text-gray-500 mb-0.5">Stake</div>
            <div className="text-base sm:text-lg font-bold text-[#00FF88]">
              ${formatTokenAmount(BigInt(creatorStake), 6)}
            </div>
            <div className="text-xs text-gray-400">
              Bet: ${formatTokenAmount(BigInt(requiredStake), 6)}
            </div>
          </div>
        </div>

        {/* Prediction - More compact for mobile */}
        <div className="mb-3 sm:mb-4">
          <p className="text-gray-300 text-xs sm:text-sm leading-relaxed break-words">
            <span className="font-bold text-[#00FF88]">{alpha.ticker}</span>{" "}
            <span className="font-bold text-yellow-400">above</span>{" "}
            <span className="font-bold text-white break-all">
              ${formatTokenAmount(alpha.targetPrice, 18)}
            </span>
          </p>
        </div>

        {/* Stats - Single row on mobile */}
        <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-3 sm:mb-4">
          <div className="bg-black/30 rounded-lg p-2 sm:p-3">
            <div className="text-xs text-gray-500 mb-0.5 sm:mb-1">Creator</div>
            <div className="text-xs sm:text-sm font-mono text-gray-300 break-all">
              {alpha.creator.slice(0, 4)}...{alpha.creator.slice(-3)}
            </div>
          </div>
          <div className="bg-black/30 rounded-lg p-2 sm:p-3">
            <div className="text-xs text-gray-500 mb-0.5 sm:mb-1">Expires</div>
            <div className="text-xs sm:text-sm font-bold text-[#00FF88] break-words">
              {timeLeft}
            </div>
          </div>
        </div>

        {/* Betting Pool Info - Compact */}
        <div className="mb-3 sm:mb-4 flex-1">
          <div className="flex justify-between text-xs text-gray-400 mb-1.5 sm:mb-2">
            <span className="break-words">
              Pool: ${formatTokenAmount(BigInt(totalPool), 6)}
            </span>
            <span className="text-red-400 whitespace-nowrap">
              {Number(alpha.opponentCount)}/10
            </span>
          </div>
          <div className="w-full h-1.5 sm:h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-500 to-red-700 transition-all duration-300"
              style={{
                width: `${(Number(alpha.opponentCount) / 10) * 100}%`,
              }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {availablePositions > 0
              ? `${availablePositions} positions left`
              : "Full"}
          </div>
        </div>

        {/* Status Badge */}
        {(isExpiredNow || alpha.settled) && (
          <div className="mb-3 sm:mb-4">
            <div
              className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-lg text-xs font-semibold ${
                alpha.settled
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                  alpha.settled ? "bg-blue-400" : "bg-yellow-400"
                }`}
              ></span>
              {alpha.settled ? "Settled" : "Expired"}
            </div>
          </div>
        )}

        {/* Action Button - Single full width */}
        <button
          disabled={availablePositions === 0 || isExpiredNow || alpha.settled}
          className={`w-full font-semibold py-2.5 sm:py-3 px-4 rounded-lg sm:rounded-xl transition-all duration-300 text-sm sm:text-base ${
            availablePositions === 0 || isExpiredNow || alpha.settled
              ? "bg-gray-600/20 text-gray-500 border border-gray-600/30 cursor-not-allowed"
              : "bg-[#00FF88]/20 hover:bg-[#00FF88]/30 text-[#00FF88] border border-[#00FF88]/30 hover:border-[#00FF88]/50"
          }`}
          onClick={(e) => {
            if (availablePositions === 0 || isExpiredNow || alpha.settled) {
              e.preventDefault();
            }
          }}
        >
          {alpha.settled
            ? "View Details"
            : isExpiredNow
            ? "View Details"
            : availablePositions === 0
            ? "View Details"
            : `Bet Against • ${availablePositions} left`}
        </button>
      </div>
    </Link>
  );
}
