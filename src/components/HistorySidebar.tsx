import { useState, useEffect, type MouseEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  History,
  RotateCcw,
  Copy,
  Check,
  Trash2,
  ExternalLink,
  QrCode,
  ArrowRight,
  Share2
} from "lucide-react";
import { QrHistoryItem } from "../types";

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  history: QrHistoryItem[];
  currentUrl: string;
  onRestore: (item: QrHistoryItem) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

function formatRelativeTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 45) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export default function HistorySidebar({
  isOpen,
  onClose,
  history,
  currentUrl,
  onRestore,
  onRemove,
  onClear,
}: HistorySidebarProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleCopyUrl = async (e: MouseEvent, item: QrHistoryItem) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(item.url);
      setCopiedId(item.id);
      setTimeout(() => {
        setCopiedId(null);
      }, 1500);
    } catch {
      // fallback
    }
  };

  const handleShareUrl = async (e: MouseEvent, item: QrHistoryItem) => {
    e.stopPropagation();
    const shareUrl = item.url.startsWith("http") ? item.url : `https://${item.url}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "QR Code Link",
          text: `QR Code destination: ${shareUrl}`,
          url: shareUrl,
        });
        return;
      } catch (err: any) {
        if (err?.name === "AbortError") return;
      }
    }
    handleCopyUrl(e, item);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-neutral-900/40 dark:bg-black/70 backdrop-blur-[2px] transition-opacity"
            aria-hidden="true"
          />

          {/* Drawer Container */}
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="w-screen max-w-md bg-white dark:bg-neutral-900 border-l-2 border-neutral-900 dark:border-neutral-200 shadow-2xl flex flex-col h-full"
              role="dialog"
              aria-modal="true"
              aria-labelledby="history-sidebar-title"
            >
              {/* Header */}
              <div className="p-6 border-b-2 border-neutral-900/10 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-950">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center">
                    <History className="w-4 h-4" />
                  </div>
                  <div>
                    <h2
                      id="history-sidebar-title"
                      className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-900 dark:text-white"
                    >
                      Recent History
                    </h2>
                    <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500 uppercase tracking-widest block">
                      Last 5 Generated Codes ({history.length}/5)
                    </span>
                  </div>
                </div>

                <button
                  id="close-history-sidebar-btn"
                  onClick={onClose}
                  className="w-8 h-8 border-2 border-neutral-900 dark:border-neutral-200 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white flex items-center justify-center hover:bg-neutral-900 hover:text-white dark:hover:bg-white dark:hover:text-neutral-900 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.7)] cursor-pointer"
                  aria-label="Close recent history drawer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {history.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-neutral-300 dark:border-neutral-700">
                    <div className="w-12 h-12 border-2 border-neutral-900 dark:border-neutral-300 flex items-center justify-center mb-3">
                      <QrCode className="w-6 h-6 text-neutral-400 dark:text-neutral-500" />
                    </div>
                    <p className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider mb-1">
                      No Records Yet
                    </p>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 max-w-[220px] font-mono leading-relaxed">
                      Generated destination URLs will automatically be preserved here for instant reloading.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {history.map((item, index) => {
                      const isCurrent = currentUrl.trim() === item.url.trim();

                      return (
                        <div
                          key={item.id}
                          id={`history-item-${index}`}
                          onClick={() => onRestore(item)}
                          className={`group relative p-4 border-2 transition-all cursor-pointer select-none ${
                            isCurrent
                              ? "border-neutral-900 dark:border-white bg-neutral-100/90 dark:bg-neutral-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.8)]"
                              : "border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 hover:border-neutral-900 dark:hover:border-neutral-200 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.4)]"
                          }`}
                        >
                          {/* Top Row: Index & Timestamp */}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 uppercase">
                                0{index + 1}
                              </span>
                              <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500">
                                {formatRelativeTime(item.timestamp)}
                              </span>
                            </div>

                            {isCurrent && (
                              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-1.5 py-0.5 border border-emerald-300 dark:border-emerald-700">
                                Active Code
                              </span>
                            )}
                          </div>

                          {/* URL text */}
                          <div className="mb-3">
                            <p
                              className="font-mono text-xs font-bold text-neutral-900 dark:text-white break-all leading-snug group-hover:text-neutral-950 dark:group-hover:text-white"
                              title={item.url}
                            >
                              {item.url}
                            </p>
                          </div>

                          {/* Metadata row: Color swatches & specs */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800 text-[10px] font-mono text-neutral-500 dark:text-neutral-400">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                <span
                                  className="w-3 h-3 border border-neutral-400 inline-block"
                                  style={{ backgroundColor: item.qrColor }}
                                  title={`Matrix: ${item.qrColor}`}
                                />
                                <span
                                  className="w-3 h-3 border border-neutral-400 inline-block"
                                  style={{ backgroundColor: item.bgColor }}
                                  title={`Background: ${item.bgColor}`}
                                />
                              </div>
                              <span>{item.size}px</span>
                              <span>•</span>
                              <span>ECC {item.errorCorrection}</span>
                              {item.logo?.enabled && (
                                <span className="px-1 py-0.2 bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-[9px] uppercase font-mono border border-neutral-300 dark:border-neutral-700">
                                  +Badge
                                </span>
                              )}
                            </div>

                            {/* Actions inside card */}
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={(e) => handleShareUrl(e, item)}
                                title="Share destination link"
                                className="p-1 text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={(e) => handleCopyUrl(e, item)}
                                title="Copy destination link"
                                className="p-1 text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                              >
                                {copiedId === item.id ? (
                                  <span className="flex items-center gap-1 text-emerald-600 font-bold text-[9px]">
                                    <Check className="w-3 h-3" />
                                    Copied
                                  </span>
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onRemove(item.id);
                                }}
                                title="Remove from history"
                                className="p-1 text-neutral-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>

                              <span className="ml-1 text-[9px] font-bold text-neutral-900 dark:text-white group-hover:translate-x-0.5 transition-transform flex items-center">
                                <ArrowRight className="w-3 h-3" />
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer info & Clear button */}
              {history.length > 0 && (
                <div className="p-4 border-t-2 border-neutral-900/10 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500">
                    Click any item to reload
                  </span>
                  <button
                    id="clear-all-history-btn"
                    onClick={onClear}
                    className="flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500 hover:text-red-600 dark:text-neutral-400 dark:hover:text-red-400 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    Clear History
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
