"use client";

import {
  useAccount,
  useChainId,
  useConnect,
  useDisconnect,
  useSwitchChain,
} from "wagmi";
import { truncateAddress } from "~/lib/truncateAddress";
import { useCallback, useEffect, useRef, useState } from "react";
import { useMiniApp } from "@neynar/react";

export default function Navbar() {
  const { connect, connectors } = useConnect();
  const { address, isConnected } = useAccount();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const { context } = useMiniApp();
  const [copied, setCopied] = useState(false);
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const chainId = useChainId();

  const handleSwitchChain = useCallback(() => {
    console.log("switching chain");
    switchChain({ chainId: 84532 });
    console.log("done switching chain");
  }, [switchChain]);

  useEffect(() => {
    if (chainId !== 84532) {
      handleSwitchChain();
    }
  }, [handleSwitchChain, chainId]);

  return (
    <>
      <div className="container mx-auto max-w-7xl px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 mx-auto mb-4 flex items-center justify-center cursor-pointer overflow-hidden">
            <img
              src="/r-logo.png"
              alt="Raptor Logo"
              className="w-full h-full object-contain"
            />
          </div>

          <span className="text-sm text-text-secondary font-semibold">
            RAPTOR
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Wallet Address and Copy Button */}
          {isConnected && address && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#0b0b0b] border border-[#00FF88]/30 rounded-lg">
              <span className="text-xs text-[#00FF88] font-mono">
                {truncateAddress(address)}
              </span>
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(address);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1200);
                  } catch {}
                }}
                className="flex items-center justify-center w-5 h-5 rounded hover:bg-[#00FF88]/20 transition-colors"
                title="Copy address"
              >
                {copied ? (
                  <svg
                    className="w-3.5 h-3.5 text-[#00FF88]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-3.5 h-3.5 text-gray-400 hover:text-[#00FF88]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                )}
              </button>
            </div>
          )}

          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen((v) => !v)}
              className="flex items-center gap-2"
              aria-haspopup="menu"
              aria-expanded={profileOpen}
            >
              <img
                src={context?.user?.pfpUrl || "/logo.png"}
                alt="Profile"
                className="w-9 h-9 rounded-lg border border-subtle object-cover"
              />
            </button>
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-[#0b0b0b] border border-[#00FF88]/30 rounded-lg shadow-xl overflow-hidden z-50 backdrop-blur-lg">
                <div className="px-4 py-3 border-b border-[#00FF88]/20 space-y-1">
                  <p className="text-xs text-gray-300 font-semibold">Account</p>
                  {isConnected && address ? (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-[#00FF88] font-mono">
                        {truncateAddress(address)}
                      </span>

                      <button
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(address);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 1200);
                          } catch {}
                        }}
                        className="text-[11px] px-2 py-0.5 rounded bg-[#1a1a1a] text-gray-300 hover:bg-[#00FF88]/20 hover:text-[#00FF88] transition-colors"
                      >
                        {copied ? "Copied" : "Copy"}
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400">Not connected</p>
                  )}
                </div>
                <div className="p-2 space-y-1">
                  {connectors?.[0] && (
                    <button
                      onClick={() => {
                        connect({ connector: connectors[0] });
                        setProfileOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-[#00FF88]/10 hover:text-[#00FF88] rounded transition-colors"
                    >
                      Connect Farcaster
                    </button>
                  )}
                  {connectors?.[1] && (
                    <button
                      onClick={() => {
                        connect({ connector: connectors[1] });
                        setProfileOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-[#00FF88]/10 hover:text-[#00FF88] rounded transition-colors"
                    >
                      Connect Coinbase Wallet
                    </button>
                  )}
                  {connectors?.[2] && (
                    <button
                      onClick={() => {
                        connect({ connector: connectors[2] });
                        setProfileOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-[#00FF88]/10 hover:text-[#00FF88] rounded transition-colors"
                    >
                      Connect MetaMask
                    </button>
                  )}
                </div>
                {isConnected && (
                  <>
                    <div className="border-t border-[#00FF88]/20" />
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        disconnect();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      Disconnect
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
