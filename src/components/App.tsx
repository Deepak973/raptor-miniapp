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
      </main>

      <Footer />
    </div>
  );
}
