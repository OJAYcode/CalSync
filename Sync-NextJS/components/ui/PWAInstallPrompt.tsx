"use client";

import { useEffect, useState } from "react";
import { X, Download, Share, Plus } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Platform = "android" | "ios" | "desktop" | "unknown";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  return "desktop";
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && (navigator as any).standalone === true)
  );
}

const DISMISSED_KEY = "calsync-pwa-dismissed";
const DISMISSED_EXPIRY_DAYS = 7;

function wasDismissedRecently(): boolean {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    if (!raw) return false;
    const ts = parseInt(raw, 10);
    const daysAgo = (Date.now() - ts) / (1000 * 60 * 60 * 24);
    return daysAgo < DISMISSED_EXPIRY_DAYS;
  } catch {
    return false;
  }
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [platform, setPlatform] = useState<Platform>("unknown");
  const [showIOSSteps, setShowIOSSteps] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Don't show if already installed as PWA
    if (isStandalone()) {
      setInstalled(true);
      return;
    }
    if (wasDismissedRecently()) return;

    const detected = detectPlatform();
    setPlatform(detected);

    if (detected === "ios") {
      // iOS doesn't fire beforeinstallprompt — show manual instructions after delay
      const timer = setTimeout(() => setVisible(true), 3000);
      return () => clearTimeout(timer);
    }

    // Android / Desktop: listen for the native install event
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Already installed listener
    window.addEventListener("appinstalled", () => {
      setInstalled(true);
      setVisible(false);
      setDeferredPrompt(null);
    });

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (platform === "ios") {
      setShowIOSSteps(true);
      return;
    }
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setInstalled(true);
    }
    setVisible(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setVisible(false);
    setShowIOSSteps(false);
    try {
      localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    } catch {}
  };

  if (installed || !visible) return null;

  return (
    <>
      {/* Install Banner */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[9999] px-4 pb-safe"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 12px)" }}
      >
        <div className="mx-auto max-w-lg bg-white border border-blue-100 rounded-2xl shadow-2xl overflow-hidden">
          {/* Top strip */}
          <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-700" />

          <div className="p-4">
            <div className="flex items-start gap-3">
              {/* App icon */}
              <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-blue-600 flex items-center justify-center shadow-md">
                <img
                  src="/icons/icon.svg"
                  alt="CalSync"
                  className="w-10 h-10"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm leading-tight">
                      Install CalSync
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                      {platform === "ios"
                        ? "Add to your Home Screen for quick access"
                        : platform === "android"
                          ? "Add to your Home Screen — works offline"
                          : "Install as a desktop app for quick access"}
                    </p>
                  </div>
                  <button
                    onClick={handleDismiss}
                    className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                    aria-label="Dismiss"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Buttons */}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleInstall}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
                  >
                    {platform === "ios" ? (
                      <>
                        <Share className="w-4 h-4" />
                        How to Install
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Install App
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    Not now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* iOS Instructions Modal */}
      {showIOSSteps && (
        <div className="fixed inset-0 z-[10000] flex items-end justify-center px-4 pb-6 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-700" />
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 text-base">
                  Add to Home Screen
                </h3>
                <button
                  onClick={handleDismiss}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <ol className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-sm font-bold flex items-center justify-center">
                    1
                  </span>
                  <div className="pt-0.5">
                    <p className="text-sm text-gray-700 leading-snug">
                      Tap the{" "}
                      <strong className="inline-flex items-center gap-1">
                        Share <Share className="w-3.5 h-3.5 inline" />
                      </strong>{" "}
                      button in Safari's toolbar (bottom or top of screen)
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-sm font-bold flex items-center justify-center">
                    2
                  </span>
                  <div className="pt-0.5">
                    <p className="text-sm text-gray-700 leading-snug">
                      Scroll down and tap{" "}
                      <strong className="inline-flex items-center gap-1">
                        Add to Home Screen{" "}
                        <Plus className="w-3.5 h-3.5 inline" />
                      </strong>
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-sm font-bold flex items-center justify-center">
                    3
                  </span>
                  <div className="pt-0.5">
                    <p className="text-sm text-gray-700 leading-snug">
                      Tap <strong>Add</strong> in the top-right corner — done!
                    </p>
                  </div>
                </li>
              </ol>

              <button
                onClick={handleDismiss}
                className="w-full mt-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
