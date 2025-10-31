"use client";

import { useState, useMemo } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import AlphaCard from "../components/AlphaCard";
import { useAlphaList } from "../../lib/hooks";
import { isExpired } from "../../lib/contract";

type FilterType = "active" | "expired" | "all";

export default function AlphasPage() {
  const { data: alphas = [], isLoading } = useAlphaList(0, 20);
  const [filter, setFilter] = useState<FilterType>("active");

  // Filter out uninitialized alphas (those with expiry = 0 or asset = address(0))
  const validAlphas = useMemo(() => {
    return alphas.filter(
      (alpha) =>
        alpha.expiry > BigInt(0) &&
        alpha.asset &&
        alpha.asset !== "0x0000000000000000000000000000000000000000"
    );
  }, [alphas]);

  // Filter alphas based on selected tab and preserve original index (alpha ID)
  const filteredAlphas = useMemo(() => {
    const alphasWithId = validAlphas.map((alpha, index) => {
      // Find the original index in the full alphas array
      const originalIndex = alphas.findIndex(
        (a) =>
          a.asset === alpha.asset &&
          a.expiry === alpha.expiry &&
          a.creator === alpha.creator &&
          a.stake === alpha.stake
      );
      return {
        alpha,
        alphaId: originalIndex >= 0 ? originalIndex : index,
      };
    });

    if (filter === "active") {
      return alphasWithId.filter(
        ({ alpha }) => !isExpired(alpha.expiry) && !alpha.settled
      );
    } else if (filter === "expired") {
      return alphasWithId.filter(
        ({ alpha }) => isExpired(alpha.expiry) && !alpha.settled
      );
    }
    return alphasWithId;
  }, [validAlphas, alphas, filter]);

  const activeCount = validAlphas.filter(
    (alpha) => !isExpired(alpha.expiry) && !alpha.settled
  ).length;
  const expiredCount = validAlphas.filter(
    (alpha) => isExpired(alpha.expiry) && !alpha.settled
  ).length;

  return (
    <div className="min-h-screen flex flex-col pb-20 md:pb-0">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8 lg:py-12 w-full">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8 lg:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2 sm:mb-4 font-mono">
            browse_alphas
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 mb-6 sm:mb-8">
          <button
            onClick={() => setFilter("active")}
            className={`px-4 sm:px-6 py-2 rounded-lg font-mono text-sm sm:text-base transition-all ${
              filter === "active"
                ? "bg-[#00FF88] text-black font-bold"
                : "bg-black/40 border border-[#00FF88]/30 text-[#00FF88] hover:bg-[#00FF88]/10"
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setFilter("expired")}
            className={`px-4 sm:px-6 py-2 rounded-lg font-mono text-sm sm:text-base transition-all ${
              filter === "expired"
                ? "bg-[#00FF88] text-black font-bold"
                : "bg-black/40 border border-[#00FF88]/30 text-[#00FF88] hover:bg-[#00FF88]/10"
            }`}
          >
            Expired ({expiredCount})
          </button>
          <button
            onClick={() => setFilter("all")}
            className={`px-4 sm:px-6 py-2 rounded-lg font-mono text-sm sm:text-base transition-all ${
              filter === "all"
                ? "bg-[#00FF88] text-black font-bold"
                : "bg-black/40 border border-[#00FF88]/30 text-[#00FF88] hover:bg-[#00FF88]/10"
            }`}
          >
            All ({validAlphas.length})
          </button>
        </div>

        {/* Active Alphas Grid */}
        <div className="mb-8 sm:mb-12 lg:mb-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {isLoading ? (
              <div className="col-span-full text-center py-12">
                <div className="text-4xl mb-4">🦖</div>
                <p className="text-gray-400 font-mono">Loading alphas...</p>
              </div>
            ) : filteredAlphas.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <div className="flex justify-center mb-4">
                  <div className="text-5xl">📊</div>
                </div>
                <p className="text-gray-400 font-mono">
                  {filter === "active"
                    ? "No active alphas found"
                    : filter === "expired"
                    ? "No expired alphas found"
                    : "No alphas found"}
                </p>
              </div>
            ) : (
              filteredAlphas.map(({ alpha, alphaId }) => (
                <AlphaCard
                  key={`${alphaId}-${alpha.asset}-${alpha.expiry}`}
                  alpha={alpha}
                  alphaId={alphaId}
                />
              ))
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
