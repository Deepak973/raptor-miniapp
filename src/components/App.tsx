"use client";

import { useEffect, useState } from "react";
import { useMiniApp } from "@neynar/react";
import { useAccount } from "wagmi";
import Image from "next/image";

import Navbar from "../app/components/Navbar";
import Footer from "../app/components/Footer";

// Matrix typing animation component
function TypingText({
  texts,
  className = "",
}: {
  texts: string[];
  className?: string;
}) {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentText = texts[currentIndex];

    if (!isDeleting && charIndex <= currentText.length) {
      const timeout = setTimeout(() => {
        setDisplayText(currentText.substring(0, charIndex));
        setCharIndex(charIndex + 1);
      }, 100);
      return () => clearTimeout(timeout);
    } else if (isDeleting && charIndex > 0) {
      const timeout = setTimeout(() => {
        setDisplayText(currentText.substring(0, charIndex - 1));
        setCharIndex(charIndex - 1);
      }, 50);
      return () => clearTimeout(timeout);
    } else if (charIndex === currentText.length + 1) {
      const timeout = setTimeout(() => {
        setIsDeleting(true);
      }, 2000);
      return () => clearTimeout(timeout);
    } else if (isDeleting && charIndex === 0) {
      setIsDeleting(false);
      setCurrentIndex((prev) => (prev + 1) % texts.length);
    }
  }, [charIndex, isDeleting, currentIndex, texts]);

  return (
    <span className={className}>
      {displayText}
      <span className="animate-pulse">_</span>
    </span>
  );
}

export default function App() {
  const { isSDKLoaded, setInitialTab } = useMiniApp();
  const { isConnected } = useAccount();

  useEffect(() => {
    if (isSDKLoaded) {
      setInitialTab("home");
    }
  }, [isSDKLoaded, setInitialTab]);

  if (!isSDKLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="spinner h-8 w-8 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col pb-20 md:pb-0 relative overflow-hidden">
      {/* Matrix background effect */}
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <div className="matrix-bg"></div>
      </div>

      <Navbar />

      <main className="flex-1 relative z-10">
        {/* Logo Section - Just below header */}
        <div className="flex justify-center pt-6 pb-4">
          <div className="relative">
            <div className="absolute inset-0 blur-2xl bg-[#00FF88]/30 rounded-full animate-pulse"></div>
            <div className="relative w-24 h-24 md:w-28 md:h-28">
              <Image
                src="/logo.png"
                alt="RAPTOR Logo"
                fill
                className="object-contain drop-shadow-[0_0_15px_rgba(0,255,136,0.5)]"
                priority
              />
            </div>
          </div>
        </div>

        {/* Hero Section - Matrix Style */}
        <section className="relative overflow-hidden w-full flex items-start justify-center min-h-[calc(100vh-200px)]">
          {/* Animated grid background */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,136,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,136,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#00FF88]/5 to-transparent"></div>
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
            <div className="flex flex-col items-center text-center space-y-6">
              {/* Main Title with Matrix Font */}
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold font-mono text-[#00FF88] tracking-wider relative">
                <span className="relative z-10 drop-shadow-[0_0_10px_rgba(0,255,136,0.6)]">
                  RAPTOR
                </span>
                <div className="absolute inset-0 text-[#00FF88]/20 blur-md">
                  RAPTOR
                </div>
              </h1>

              {/* Tagline with typing animation */}
              <div className="text-lg md:text-xl font-mono text-[#00FF88] min-h-[1.5rem]">
                <TypingText
                  texts={["Alpha with credibility"]}
                  className="text-[#00FF88]"
                />
              </div>

              {/* Terminal Display - Fixed height to prevent layout shifts */}
              <div className="w-full max-w-2xl mx-auto">
                <div className="glass-panel rounded-xl p-6 border-2 border-[#00FF88]/30 relative overflow-hidden min-h-[140px]">
                  {/* Scan line effect */}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#00FF88]/10 to-transparent animate-scan h-1"></div>

                  <div className="font-mono text-left space-y-3 text-sm md:text-base">
                    <div className="text-[#00FF88]">
                      <span className="text-gray-500">&gt;</span>{" "}
                      <span className="text-[#00FF88]">system.init</span>
                      <span className="text-gray-400">()</span>
                    </div>
                    <div className="text-gray-300">
                      <span className="text-gray-500">&gt;</span>{" "}
                      <span className="text-[#00FF88]">ready</span>
                    </div>
                    <div className="text-[#00FF88] min-h-[1.25rem]">
                      <span className="text-gray-500">&gt;</span>{" "}
                      {!isConnected ? (
                        <span className="text-[#00FF88]">
                          connect_wallet_to_proceed()_
                        </span>
                      ) : (
                        <TypingText
                          texts={[
                            "awaiting_user_input()",
                            "initialize_prediction_protocol()",
                            "ready_for_alpha_creation()",
                            "browse_active_predictions()",
                          ]}
                          className="text-[#00FF88]"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Matrix-style description */}
                <div className="mt-8 text-center space-y-3">
                  <p className="text-gray-400 font-mono text-xs md:text-sm max-w-xl mx-auto leading-relaxed">
                    <span className="text-[#00FF88]">{"//"}</span>{" "}
                    <span className="text-gray-300">
                      Prediction protocol where credibility meets blockchain.
                      Stake USDC. Challenge weak signals. Win rewards.
                    </span>
                  </p>
                  <p className="text-gray-500 font-mono text-xs">
                    <span className="text-[#00FF88]">{"//"}</span> Powered by
                    UMA Oracle • Trustless Resolution • Real Stakes
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 w-full">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 font-mono">
              <span className="text-gray-400">{"//"}</span> how_it_works
            </h2>
            <p className="text-gray-400 font-mono text-xs sm:text-sm max-w-2xl mx-auto">
              Simple steps to participate in the prediction market
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {/* Step 1 */}
            <div className="glass-panel rounded-xl p-4 sm:p-6 border border-[#00FF88]/20 hover:border-[#00FF88]/40 transition-all">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#00FF88]/20 flex items-center justify-center">
                  <span className="text-lg sm:text-xl font-bold text-[#00FF88] font-mono">
                    01
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-[#00FF88] mb-2 font-mono">
                    Create Alpha
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                    Stake USDC and make a price prediction. Set target price and
                    expiry time. Your credibility is on the line.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="glass-panel rounded-xl p-4 sm:p-6 border border-red-500/20 hover:border-red-500/40 transition-all">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <span className="text-lg sm:text-xl font-bold text-red-400 font-mono">
                    02
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-red-400 mb-2 font-mono">
                    Challenge
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                    Opponents bet against your prediction by staking 10% of your
                    stake. Up to 10 opponents can challenge each alpha.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="glass-panel rounded-xl p-4 sm:p-6 border border-blue-500/20 hover:border-blue-500/40 transition-all">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <span className="text-lg sm:text-xl font-bold text-blue-400 font-mono">
                    03
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-blue-400 mb-2 font-mono">
                    Settle
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                    After expiry, UMA Oracle resolves the price. Winners split
                    the pool proportionally. Trustless and automated.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-8 sm:mt-12 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="glass-panel rounded-xl p-4 sm:p-5 border border-[#00FF88]/10">
              <div className="flex items-center gap-3 mb-2">
                <div className="text-xl sm:text-2xl">💰</div>
                <h4 className="text-sm sm:text-base font-bold text-white font-mono">
                  Stakes Matter
                </h4>
              </div>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                Real money at stake builds genuine credibility. No fake signals
                or empty predictions.
              </p>
            </div>

            <div className="glass-panel rounded-xl p-4 sm:p-5 border border-[#00FF88]/10">
              <div className="flex items-center gap-3 mb-2">
                <div className="text-xl sm:text-2xl">🔒</div>
                <h4 className="text-sm sm:text-base font-bold text-white font-mono">
                  Trustless Resolution
                </h4>
              </div>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                UMA Oracle provides unbiased price data. No manual intervention
                or centralized decisions.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
