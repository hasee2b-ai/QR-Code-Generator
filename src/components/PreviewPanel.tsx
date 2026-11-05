import { motion, AnimatePresence } from "motion/react";
import { Download, Copy, Check, Share2, RefreshCw, ShieldAlert, FileCode } from "lucide-react";
import { ErrorCorrectionLevel, LogoConfig } from "../types";

interface PreviewPanelProps {
  theme: "light" | "dark";
  qrDataUrl: string;
  /** Background color rendered behind the previewed code. */
  bgColor: string;
  errorMessage: string | null;
  /** Whether the active content type has anything to encode. */
  hasContent: boolean;
  emptyTitle: string;
  emptyHint: string;
  /** Shown in the image alt text (URL, text, or SSID). */
  previewLabel: string;
  size: number;
  errorCorrection: ErrorCorrectionLevel;
  logo: LogoConfig | null;
  copied: boolean;
  shareStatus: "idle" | "shared" | "copied";
  shareFeedback: string | null;
  onDownload: () => void;
  onDownloadSvg: () => void;
  onCopy: () => void;
  onShare: () => void;
}

export default function PreviewPanel({
  theme,
  qrDataUrl,
  bgColor,
  errorMessage,
  hasContent,
  emptyTitle,
  emptyHint,
  previewLabel,
  size,
  errorCorrection,
  logo,
  copied,
  shareStatus,
  shareFeedback,
  onDownload,
  onDownloadSvg,
  onCopy,
  onShare,
}: PreviewPanelProps) {
  const canExport = !!qrDataUrl && !errorMessage;

  /**
   * Single polite live region message: export feedback ("Copied!", share
   * results and fallback text) is announced without stealing focus; errors
   * use their own role="alert" region below.
   */
  const liveMessage =
    shareFeedback ??
    (copied
      ? "Copied!"
      : shareStatus === "shared"
        ? "Shared!"
        : shareStatus === "copied"
          ? "Link copied to clipboard."
          : "");

  const primaryButtonClass = canExport
    ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 active:translate-x-[2px] active:translate-y-[2px] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] border-2 border-neutral-900 dark:border-white cursor-pointer"
    : "bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600 border border-neutral-300 dark:border-neutral-700 cursor-not-allowed";

  const secondaryButtonClass = canExport
    ? "bg-white dark:bg-neutral-900 border-2 border-neutral-900 dark:border-neutral-100 text-neutral-900 dark:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800 active:translate-x-[2px] active:translate-y-[2px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.7)] cursor-pointer"
    : "bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-300 dark:text-neutral-700 cursor-not-allowed";

  return (
    <section
      aria-label="QR code preview"
      className="w-full lg:w-1/2 bg-neutral-100 dark:bg-neutral-950 flex flex-col items-center justify-center p-6 sm:p-8 lg:p-8 xl:p-12 relative border-t lg:border-t-0 lg:border-l border-neutral-900/10 dark:border-neutral-800 transition-colors lg:sticky lg:top-0 lg:self-start lg:h-screen"
    >
      {/* Polite live region: announces export feedback and share fallbacks. */}
      <div aria-live="polite" className="sr-only">
        {liveMessage}
      </div>

      {/* Radial Dotted Grid Decoration matching theme */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage: theme === "dark" ? "radial-gradient(#ffffff 1px, transparent 1px)" : "radial-gradient(#000000 1px, transparent 1px)",
          backgroundSize: "20px 20px"
        }}
      />

      <div className="relative group z-10 w-full max-w-md flex flex-col items-center my-auto pb-24 lg:pb-0">

        {/* Real QR Box - Geometric Balance styled container */}
        <div className="w-64 h-64 sm:w-72 sm:h-72 xl:w-80 xl:h-80 bg-white dark:bg-neutral-900 border-2 border-neutral-900 dark:border-neutral-100 p-5 sm:p-6 xl:p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,0.05)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,0.05)] flex flex-col items-center justify-center transition-all">
          <div className="w-full h-full border-4 border-neutral-900 dark:border-neutral-100 relative p-1 flex items-center justify-center">

            <AnimatePresence mode="wait">
              {hasContent ? (
                qrDataUrl && !errorMessage ? (
                  <motion.div
                    key={qrDataUrl}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full h-full flex items-center justify-center bg-white"
                    style={{ backgroundColor: bgColor }}
                  >
                    <img
                      src={qrDataUrl}
                      alt={`QR code for ${previewLabel}`}
                      className="max-h-full max-w-full object-contain p-1 select-none"
                      referrerPolicy="no-referrer"
                    />
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2">
                    <RefreshCw className="w-6 h-6 text-neutral-400 dark:text-neutral-500 animate-spin" />
                    <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400">Compiling matrix...</span>
                  </div>
                )
              ) : (
                <div className="text-center p-4">
                  <div className="w-10 h-10 border-2 border-neutral-900 dark:border-neutral-100 mx-auto flex items-center justify-center text-neutral-900 dark:text-white mb-2 font-black">?</div>
                  <p className="text-[11px] font-bold text-neutral-900 dark:text-white uppercase tracking-wider">{emptyTitle}</p>
                  <p className="text-[9px] text-neutral-400 dark:text-neutral-500 font-mono mt-1 uppercase max-w-[150px] mx-auto">
                    {emptyHint}
                  </p>
                </div>
              )}
            </AnimatePresence>

          </div>
        </div>

        {/* Error notifications container */}
        {errorMessage && (
          <div
            role="alert"
            className="mt-6 w-full p-3 border-2 border-red-900 dark:border-red-600 bg-red-50 dark:bg-red-950/40 flex gap-2 text-red-900 dark:text-red-300 text-xs rounded-none font-mono"
          >
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Interactive metadata details */}
        <div className="mt-6 xl:mt-8 flex flex-col items-center w-full">
          <div className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-3 xl:mb-4 text-center">
            PREVIEW PATTERN // {size} x {size} PX // ERR_CORR: {logo?.enabled && logo.src ? "H (CALIBRATED)" : errorCorrection}
            {logo?.enabled && logo.src ? ` // BADGE: ${logo.type === "preset" ? (logo.name || "ICON") : "CUSTOM"}` : ""}
          </div>

          {/* Bottom Action Buttons - Geometric Balance Layout */}
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <div className="grid grid-cols-2 sm:flex sm:flex-row gap-3 w-full">
              <button
                id="download-qr-btn"
                onClick={onDownload}
                disabled={!canExport}
                className={`flex-1 px-4 py-3.5 font-bold uppercase tracking-wider text-xs font-mono flex items-center justify-center gap-1.5 rounded-none transition-all whitespace-nowrap ${primaryButtonClass}`}
                title="Download PNG image file"
              >
                <span>Download</span>
                <Download className="w-3.5 h-3.5" />
              </button>

              <button
                id="download-qr-svg-btn"
                onClick={onDownloadSvg}
                disabled={!canExport}
                className={`flex-1 px-4 py-3.5 font-bold uppercase tracking-wider text-xs font-mono flex items-center justify-center gap-1.5 rounded-none transition-all whitespace-nowrap ${secondaryButtonClass}`}
                title="Download scalable SVG image file"
              >
                <span>SVG</span>
                <FileCode className="w-3.5 h-3.5" />
              </button>

              <button
                id="copy-qr-btn"
                onClick={onCopy}
                disabled={!canExport}
                className={`flex-1 px-4 py-3.5 font-bold uppercase tracking-wider text-xs font-mono flex items-center justify-center gap-1.5 rounded-none transition-all whitespace-nowrap ${secondaryButtonClass}`}
                title="Copy QR image to clipboard"
              >
                {copied ? (
                  <>
                    <span>Copied!</span>
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  </>
                ) : (
                  <>
                    <span>Copy</span>
                    <Copy className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              <button
                id="share-qr-btn"
                onClick={onShare}
                disabled={!canExport}
                className={`flex-1 px-4 py-3.5 font-bold uppercase tracking-wider text-xs font-mono flex items-center justify-center gap-1.5 rounded-none transition-all whitespace-nowrap ${secondaryButtonClass}`}
                title="Share QR code image via Web Share API"
              >
                {shareStatus === "shared" ? (
                  <>
                    <span>Shared!</span>
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  </>
                ) : shareStatus === "copied" ? (
                  <>
                    <span>Link Copied</span>
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  </>
                ) : (
                  <>
                    <span>Share</span>
                    <Share2 className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Share feedback toast if fallback occurred */}
          <AnimatePresence>
            {shareFeedback && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="mt-3 text-center text-[10px] font-mono text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 px-3 py-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.1)]"
              >
                {shareFeedback}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* Mobile sticky bottom bar with QR thumbnail and Download button */}
      {qrDataUrl && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-neutral-950/95 backdrop-blur border-t border-neutral-900/10 dark:border-neutral-800 px-4 py-2 flex items-center gap-3">
          <div className="w-12 h-12 border border-neutral-900 dark:border-neutral-100 flex-shrink-0 bg-white" style={{ backgroundColor: bgColor }}>
            <img src={qrDataUrl} alt="QR code thumbnail" className="w-full h-full object-contain p-0.5" />
          </div>
          <button
            id="download-qr-btn-mobile"
            onClick={onDownload}
            disabled={!canExport}
            aria-label="Download QR code (mobile bar)"
            className={`flex-1 px-4 py-2.5 font-bold uppercase tracking-wider text-xs font-mono flex items-center justify-center gap-1.5 rounded-none transition-all ${primaryButtonClass}`}
            title="Download PNG image file"
          >
            <span>Download</span>
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </section>
  );
}
