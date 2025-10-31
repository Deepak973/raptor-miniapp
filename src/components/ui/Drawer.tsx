"use client";

import { useEffect } from "react";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onDrawerStateChange?: (isOpen: boolean) => void;
}

export function Drawer({
  isOpen,
  onClose,
  title,
  children,
  onDrawerStateChange,
}: DrawerProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      // Add class to body to hide footer
      document.body.classList.add("drawer-open");
    } else {
      document.body.style.overflow = "";
      document.body.classList.remove("drawer-open");
    }

    if (onDrawerStateChange) {
      onDrawerStateChange(isOpen);
    }

    return () => {
      document.body.style.overflow = "";
      document.body.classList.remove("drawer-open");
    };
  }, [isOpen, onDrawerStateChange]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-x-0 bottom-0 z-50 max-h-[90vh] overflow-hidden">
        <div className="glass-panel border-t-2 border-[#00FF88]/30 rounded-t-3xl shadow-2xl flex flex-col max-h-[90vh]">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1 bg-gray-600 rounded-full"></div>
          </div>

          {/* Header */}
          <div className="px-4 sm:px-6 py-3 border-b border-[#00FF88]/20 flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#00FF88]">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-[#00FF88] transition-colors p-1"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 text-sm">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
