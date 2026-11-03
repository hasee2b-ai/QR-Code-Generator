/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { motion, AnimatePresence } from "motion/react";
import {
  Link2,
  Download,
  Copy,
  Check,
  QrCode,
  Globe,
  RefreshCw,
  Trash2,
  Palette,
  Maximize2,
  Info,
  ShieldAlert,
  Sun,
  Moon,
  History,
  Share2
} from "lucide-react";
import HistorySidebar from "./components/HistorySidebar";
import LogoSelector from "./components/LogoSelector";
import { QrHistoryItem, LogoConfig } from "./types";
import { generateQrCode } from "./utils/qrGenerator";
import { PRESET_LOGOS, createPresetSvgDataUri, resolvePresetIconColor } from "./utils/presetLogos";

// Standard URL regex validation
const isValidUrl = (string: string) => {
  if (!string) return false;
  const pattern = new RegExp(
    "^(https?:\\/\\/)?" + // protocol
      "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name
      "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR ip (v4) address
      "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
      "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
      "(\\#[-a-z\\d_]*)?$", // fragment locator
    "i"
  );
  return !!pattern.test(string);
};

// Preset colors with sharp geometric blocks matching the theme
const FOR_COLOR_PRESETS = [
  { name: "Obsidian", hex: "#000000" },
  { name: "Cobalt Blue", hex: "#2563eb" },
  { name: "Emerald Green", hex: "#059669" },
  { name: "Crimson Red", hex: "#dc2626" },
  { name: "Amethyst", hex: "#7c3aed" },
  { name: "Amber Orange", hex: "#ea580c" },
];

const BACK_COLOR_PRESETS = [
  { name: "White", hex: "#ffffff" },
  { name: "Alabaster", hex: "#fafafa" },
  { name: "Soft Cream", hex: "#fffbeb" },
  { name: "Ice Cyan", hex: "#f0fdfa" },
];

// Sizing presets
const SIZE_PRESETS = [
  { label: "Small Print", desc: "Digital/Web", value: 350 },
  { label: "Medium Card", desc: "Print standard", value: 750 },
  { label: "Large Poster", desc: "High precision", value: 1500 },
  { label: "Ultra Crisp", desc: "Billboard resolution", value: 3000 },
];

// Test URL presets
const TEST_PRESETS = [
  { label: "Google", url: "https://google.com" },
  { label: "GitHub", url: "https://github.com" },
  { label: "Wikipedia", url: "https://wikipedia.org" },
  { label: "AI Studio", url: "https://ai.studio" },
];

export default function App() {
  const leftPanelRef = useRef<HTMLElement>(null);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("hk_qr_theme");
      if (saved === "light" || saved === "dark") return saved;
      if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        return "dark";
      }
    }
    return "light";
  });

  const [url, setUrl] = useState<string>("https://ai.studio/build");
  const [qrColor, setQrColor] = useState<string>("#000000");
  const [bgColor, setBgColor] = useState<string>("#ffffff");
  const [size, setSize] = useState<number>(750);
  const [errorCorrection, setErrorCorrection] = useState<"L" | "M" | "Q" | "H">("M");
  const [logo, setLogo] = useState<LogoConfig | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [shareStatus, setShareStatus] = useState<"idle" | "shared" | "copied">("idle");
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [history, setHistory] = useState<QrHistoryItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("hk_qr_history");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.slice(0, 5);
          }
        }
      } catch (e) {
        console.error("Error reading qr history", e);
      }
    }
    return [
      {
        id: "seed-1",
        url: "https://ai.studio/build",
        timestamp: Date.now(),
        qrColor: "#000000",
        bgColor: "#ffffff",
        size: 750,
        errorCorrection: "M",
        logo: null,
      },
    ];
  });

  const handleLogoChange = (newLogo: LogoConfig | null) => {
    setLogo(newLogo);
    // If a logo is enabled, auto-set error correction to H to guarantee scannability
    if (newLogo && newLogo.enabled && newLogo.src) {
      setErrorCorrection("H");
    }
  };

  // Sync preset logo color when matrix color or background changes
  useEffect(() => {
    if (logo?.type === "preset" && logo.presetId) {
      const preset = PRESET_LOGOS.find((p) => p.id === logo.presetId);
      if (preset) {
        const badgeBg = logo.bgColor || bgColor || "#ffffff";
        const iconColor = resolvePresetIconColor(badgeBg, logo.iconColor, qrColor);
        const updatedUri = createPresetSvgDataUri(preset, iconColor);
        if (logo.src !== updatedUri) {
          setLogo((prev) => (prev ? { ...prev, src: updatedUri } : null));
        }
      }
    }
  }, [qrColor, bgColor, logo?.presetId, logo?.bgColor, logo?.iconColor]);

  // Sync badge base background with pattern background
  useEffect(() => {
    if (logo?.enabled && logo.bgColor && logo.bgColor !== "#ffffff") {
      setLogo((prev) => (prev ? { ...prev, bgColor } : null));
    }
  }, [bgColor]);

  const handleRestoreHistory = (item: QrHistoryItem) => {
    setUrl(item.url);
    if (item.qrColor) setQrColor(item.qrColor);
    if (item.bgColor) setBgColor(item.bgColor);
    if (item.size) setSize(item.size);
    if (item.errorCorrection) setErrorCorrection(item.errorCorrection);
    if (item.logo) {
      setLogo(item.logo);
    } else {
      setLogo(null);
    }
    setIsHistoryOpen(false);
  };

  const handleRemoveHistoryItem = (id: string) => {
    setHistory((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      try {
        localStorage.setItem("hk_qr_history", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem("hk_qr_history");
    } catch {}
  };

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("hk_qr_theme", theme);
  }, [theme]);

  // Auto-detect if user input requires protocol helper
  const needsProtocol = url && !/^https?:\/\//i.test(url);
  const urlIsValid = isValidUrl(url);

  // Generate QR code with options and center logo
  useEffect(() => {
    let active = true;

    if (!url.trim()) {
      setQrDataUrl("");
      setIsGenerating(false);
      return;
    }

    setIsGenerating(true);

    const generate = async () => {
      let finalContent = url;
      if (needsProtocol && url.includes(".")) {
        finalContent = `https://${url}`;
      }

      try {
        const startTime = Date.now();
        const dataUrl = await generateQrCode({
          url: finalContent,
          size,
          qrColor,
          bgColor,
          errorCorrection,
          logo,
        });

        // Ensure minimum visual duration so the subtle progress animation can be seen
        const elapsed = Date.now() - startTime;
        if (elapsed < 200) {
          await new Promise((r) => setTimeout(r, 200 - elapsed));
        }

        if (active) {
          setQrDataUrl(dataUrl);
          setErrorMessage(null);

          // Update recent history with the generated QR code (last 5 entries)
          if (finalContent.trim().length >= 3) {
            setHistory((prev) => {
              const cleanUrl = finalContent.trim();
              const filtered = prev.filter(
                (item) => item.url.trim().toLowerCase() !== cleanUrl.toLowerCase()
              );
              const newItem: QrHistoryItem = {
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                url: cleanUrl,
                timestamp: Date.now(),
                qrColor,
                bgColor,
                size,
                errorCorrection: logo?.enabled && logo.src ? "H" : errorCorrection,
                logo: logo && logo.enabled && logo.src ? { ...logo } : null,
              };
              const updated = [newItem, ...filtered].slice(0, 5);
              try {
                localStorage.setItem("hk_qr_history", JSON.stringify(updated));
              } catch {}
              return updated;
            });
          }
        }
      } catch (err: any) {
        console.error(err);
        if (active) {
          setErrorMessage(err?.message || "Failed to generate matrix patterns. Try other values.");
        }
      } finally {
        if (active) setIsGenerating(false);
      }
    };

    const timer = setTimeout(() => {
      generate();
    }, 70);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [url, qrColor, bgColor, size, errorCorrection, logo, needsProtocol]);

  // Download QR code as PNG file
  const handleDownload = () => {
    if (!qrDataUrl) return;

    let cleanHostname = "qrcode";
    try {
      const parsedUrl = url.startsWith("http") ? url : `https://${url}`;
      const hostname = new URL(parsedUrl).hostname;
      cleanHostname = hostname.replace("www.", "").split(".")[0] || "qrcode";
    } catch {
      cleanHostname = "qrcode";
    }

    const link = document.createElement("a");
    link.download = `${cleanHostname}_matrix_${size}x${size}.png`;
    link.href = qrDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy PNG directly to Clipboard (falls back to copying text if not supported)
  const handleCopy = async () => {
    if (!qrDataUrl) return;

    try {
      const response = await fetch(qrDataUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn("ClipboardItem write failed, falling back to copy string URL", err);
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackErr) {
        console.error("Clipboard copy failed entirely", fallbackErr);
      }
    }
  };

  // Convert base64 dataURL to a standard File object synchronously for Web Share API
  const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(",");
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : "image/png";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  // Trigger Web Share API to send generated QR image to other devices / platforms
  const handleShare = async () => {
    if (!qrDataUrl) return;

    let cleanHostname = "qrcode";
    try {
      const parsedUrl = url.startsWith("http") ? url : `https://${url}`;
      const hostname = new URL(parsedUrl).hostname;
      cleanHostname = hostname.replace("www.", "").split(".")[0] || "qrcode";
    } catch {
      cleanHostname = "qrcode";
    }

    const fileName = `${cleanHostname}_matrix_${size}x${size}.png`;
    const shareUrl = url.startsWith("http") ? url : `https://${url}`;
    const shareTitle = `${cleanHostname} QR Code`;
    const shareText = `QR Code pointing to ${shareUrl}`;

    try {
      const file = dataURLtoFile(qrDataUrl, fileName);

      // 1. Try sharing the actual QR image file via Web Share API Level 2
      if (typeof navigator !== "undefined" && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        setShareStatus("shared");
        setTimeout(() => setShareStatus("idle"), 2500);
        return;
      }

      // 2. Try standard Web Share API with text & URL if file sharing is not supported by this browser
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        setShareStatus("shared");
        setTimeout(() => setShareStatus("idle"), 2500);
        return;
      }

      // 3. Graceful fallback if Web Share is unsupported in this environment (e.g. desktop non-compatible)
      await navigator.clipboard.writeText(shareUrl);
      setShareStatus("copied");
      setShareFeedback("Web Share unsupported on this browser. Link copied to clipboard!");
      setTimeout(() => {
        setShareStatus("idle");
        setShareFeedback(null);
      }, 3000);
    } catch (err: any) {
      if (err?.name === "AbortError") {
        // User closed or dismissed the share sheet - no error
        return;
      }
      console.warn("Web Share failed, falling back to clipboard copy", err);
      try {
        await navigator.clipboard.writeText(shareUrl);
        setShareStatus("copied");
        setShareFeedback("Link copied to clipboard!");
        setTimeout(() => {
          setShareStatus("idle");
          setShareFeedback(null);
        }, 3000);
      } catch {
        // Fallback copy failed
      }
    }
  };

  const handleClear = () => {
    setUrl("");
  };

  return (
    <div className={`min-h-screen ${theme === "dark" ? "dark" : ""} bg-neutral-50 dark:bg-neutral-950 flex flex-col font-sans overflow-x-hidden selection:bg-neutral-900 selection:text-white dark:selection:bg-white dark:selection:text-neutral-900 transition-colors duration-150 lg:h-screen lg:overflow-hidden`}>
      
      {/* Geometric Balance - Header Block */}
      <header className="relative h-20 border-b border-neutral-900/10 dark:border-neutral-800 flex items-center justify-between px-6 sm:px-12 bg-white dark:bg-neutral-950 sticky top-0 lg:static z-40 flex-shrink-0 transition-colors">
        {/* Subtle Loading Progress Bar across Header */}
        <AnimatePresence>
          {isGenerating && (
            <motion.div
              id="header-loading-bar-track"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.25 } }}
              className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-neutral-200/50 dark:bg-neutral-800/80 overflow-hidden pointer-events-none z-20"
              role="progressbar"
              aria-label="Generating QR matrix"
              aria-busy="true"
            >
              <motion.div
                id="header-loading-bar-indicator"
                className="h-full bg-neutral-900 dark:bg-white shadow-[0_0_6px_rgba(0,0,0,0.25)] dark:shadow-[0_0_8px_rgba(255,255,255,0.6)]"
                initial={{ x: "-35%", width: "35%" }}
                animate={{
                  x: ["-35%", "115%"],
                  width: ["25%", "55%", "25%"],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 0.95,
                  ease: [0.4, 0, 0.2, 1],
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-neutral-900 dark:bg-white rounded-none flex items-center justify-center transition-colors">
            <div className="w-4 h-4 border-2 border-white dark:border-neutral-900"></div>
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white uppercase font-display">
              HK QR
            </span>
          </div>
        </div>
        
        {/* Navigation Items (Thematic Styling) */}
        <nav className="hidden md:flex gap-8 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
          <a href="#" className="text-neutral-900 dark:text-white border-b-2 border-neutral-900 dark:border-white pb-1">Generator</a>
        </nav>

        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden sm:block text-[11px] font-mono text-neutral-400 dark:text-neutral-500 font-semibold tracking-wider">
            v4.0.2 // STABLE
          </div>

          {/* History Drawer Toggle Button */}
          <button
            id="history-toggle-button"
            type="button"
            onClick={() => setIsHistoryOpen(true)}
            title="Open Recent QR History"
            aria-label="Open Recent QR History"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer select-none rounded-none border-2 border-neutral-900 dark:border-neutral-200 bg-white dark:bg-neutral-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.7)] text-neutral-900 dark:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800 active:translate-x-[1px] active:translate-y-[1px]"
          >
            <History className="w-3.5 h-3.5" />
            <span className="hidden xs:inline sm:inline">History</span>
            <span className="px-1.5 py-0.2 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-[9px] font-mono leading-none">
              {history.length}
            </span>
          </button>

          {/* Dark and Light Theme Buttons */}
          <div
            id="theme-switcher-control"
            className="flex items-center border-2 border-neutral-900 dark:border-neutral-200 bg-white dark:bg-neutral-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.7)] p-0.5"
            role="group"
            aria-label="Theme mode switcher"
          >
            <button
              id="theme-btn-light"
              type="button"
              onClick={() => setTheme("light")}
              aria-pressed={theme === "light"}
              title="Switch to Light theme"
              className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer select-none rounded-none ${
                theme === "light"
                  ? "bg-neutral-900 text-white shadow-[1px_1px_0px_0px_rgba(0,0,0,0.4)]"
                  : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span className="hidden xs:inline sm:inline">Light</span>
            </button>

            <button
              id="theme-btn-dark"
              type="button"
              onClick={() => setTheme("dark")}
              aria-pressed={theme === "dark"}
              title="Switch to Dark theme"
              className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer select-none rounded-none ${
                theme === "dark"
                  ? "bg-white text-neutral-900 shadow-[1px_1px_0px_0px_rgba(255,255,255,0.4)]"
                  : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span className="hidden xs:inline sm:inline">Dark</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Split Layout */}
      <div className="flex-1 flex flex-col lg:flex-row lg:overflow-hidden min-h-0">
        
        {/* Left Side: Parameters Panel */}
        <main
          ref={leftPanelRef}
          className="w-full lg:w-1/2 border-r border-neutral-900/10 dark:border-neutral-800 p-6 sm:p-12 lg:p-12 xl:p-16 flex flex-col justify-start bg-white dark:bg-neutral-900 transition-colors lg:h-full lg:overflow-y-auto custom-scrollbar"
        >
          <div className="max-w-xl w-full mx-auto pb-12 lg:pb-16">
            
            {/* Title / Hero section strictly following theme design */}
            <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-2 block">
              INSTANT PATTERN VECTOR
            </span>
            <h1 className="text-4xl sm:text-5xl font-black text-neutral-900 dark:text-white leading-none mb-4 uppercase tracking-tighter italic font-display">
              Instant<br />Resolution.
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 mb-10 leading-relaxed text-sm sm:text-base">
              Convert any destination URL into a high-fidelity vector QR pattern. Engineered for ultimate scan reliability and absolute geometric precision.
            </p>

            {/* Input & Form Area */}
            <div className="space-y-6">
              
              {/* Destination Link Input */}
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">
                    Source Destination URL
                  </label>
                  <div className="flex items-center gap-3">
                    {history.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setIsHistoryOpen(true)}
                        className="text-[10px] font-bold text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors uppercase tracking-widest flex items-center gap-1 cursor-pointer"
                        title="View recent generated codes"
                      >
                        <History className="w-3 h-3" />
                        Recent ({history.length})
                      </button>
                    )}
                    {url && (
                      <button
                        onClick={handleClear}
                        className="text-[10px] font-bold text-neutral-400 hover:text-neutral-900 dark:text-neutral-500 dark:hover:text-white transition-colors uppercase tracking-widest flex items-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Clear Input
                      </button>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-neutral-400 dark:text-neutral-500">
                    <Globe className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. google.com or your-destination-link"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full pl-11 pr-12 py-4 bg-white dark:bg-neutral-950 border-2 border-neutral-900 dark:border-neutral-200 font-mono text-sm focus:outline-none focus:ring-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.7)] rounded-none text-neutral-900 dark:text-white placeholder:text-neutral-300 dark:placeholder:text-neutral-600 transition-all duration-200"
                  />
                  <div className="absolute inset-y-0 right-4 flex items-center">
                    {urlIsValid ? (
                      <span className="w-2.5 h-2.5 bg-neutral-900 dark:bg-white border border-neutral-900 dark:border-white" title="Valid URL structure" />
                    ) : url ? (
                      <span className="w-2.5 h-2.5 bg-neutral-200 dark:bg-neutral-700 border border-neutral-400 dark:border-neutral-600" title="Generic string data" />
                    ) : null}
                  </div>
                </div>

                {/* Sub-label information block */}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                  {needsProtocol ? (
                    <span className="text-neutral-500 dark:text-neutral-400 font-semibold bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 border border-neutral-200 dark:border-neutral-700">
                      Auto-Protocol Prefix: <code className="text-neutral-900 dark:text-white">https://{url}</code>
                    </span>
                  ) : urlIsValid ? (
                    <span className="text-neutral-800 dark:text-neutral-200 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Destination Valid
                    </span>
                  ) : (
                    <span className="text-neutral-400 dark:text-neutral-500 font-medium">Ready for real-time compilation</span>
                  )}

                  {/* Preset quick buttons */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-neutral-400 dark:text-neutral-500 font-semibold uppercase text-[9px] tracking-wider">Presets:</span>
                    <div className="flex gap-1">
                      {TEST_PRESETS.map((p) => (
                        <button
                          key={p.label}
                          onClick={() => setUrl(p.url)}
                          className={`px-1.5 py-0.5 border text-[9px] font-bold uppercase transition-all rounded-none cursor-pointer ${
                            url === p.url
                              ? "bg-neutral-900 dark:bg-white border-neutral-900 dark:border-white text-white dark:text-neutral-900 shadow-[1px_1px_0px_rgba(0,0,0,1)] dark:shadow-[1px_1px_0px_rgba(255,255,255,1)]"
                              : "bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:border-neutral-900 dark:hover:border-neutral-200 hover:text-neutral-900 dark:hover:text-white"
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Color matrix row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-neutral-900/10 dark:border-neutral-800">
                
                {/* Dark Code Matrix Color picker */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">
                    Matrix Block Color
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex flex-wrap gap-1.5 flex-1">
                      {FOR_COLOR_PRESETS.map((color) => (
                        <button
                          key={color.name}
                          onClick={() => setQrColor(color.hex)}
                          className="w-6 h-6 border-2 border-neutral-900 dark:border-neutral-600 relative transition-transform active:scale-95 rounded-none cursor-pointer"
                          style={{ backgroundColor: color.hex }}
                          title={color.name}
                        >
                          {qrColor.toLowerCase() === color.hex.toLowerCase() && (
                            <span className="absolute inset-0 flex items-center justify-center text-white mix-blend-difference">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </span>
                          )}
                        </button>
                      ))}
                    </div>

                    <div className="pl-2 border-l border-neutral-200 dark:border-neutral-700">
                      <label className="relative w-7 h-7 border-2 border-neutral-900 dark:border-neutral-300 cursor-pointer overflow-hidden flex items-center justify-center bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors rounded-none">
                        <input
                          type="color"
                          value={qrColor}
                          onChange={(e) => setQrColor(e.target.value)}
                          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                        />
                        <div
                          className="w-4 h-4 border border-neutral-900/10 dark:border-neutral-100/30"
                          style={{ backgroundColor: qrColor }}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Background matrix Color picker */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">
                    Pattern Background
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex flex-wrap gap-1.5 flex-1">
                      {BACK_COLOR_PRESETS.map((color) => (
                        <button
                          key={color.name}
                          onClick={() => setBgColor(color.hex)}
                          className="w-6 h-6 border-2 border-neutral-300 dark:border-neutral-700 relative transition-transform active:scale-95 rounded-none cursor-pointer"
                          style={{ backgroundColor: color.hex }}
                          title={color.name}
                        >
                          {bgColor.toLowerCase() === color.hex.toLowerCase() && (
                            <span className="absolute inset-0 flex items-center justify-center text-neutral-950">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </span>
                          )}
                        </button>
                      ))}
                    </div>

                    <div className="pl-2 border-l border-neutral-200 dark:border-neutral-700">
                      <label className="relative w-7 h-7 border-2 border-neutral-900 dark:border-neutral-300 cursor-pointer overflow-hidden flex items-center justify-center bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors rounded-none">
                        <input
                          type="color"
                          value={bgColor}
                          onChange={(e) => setBgColor(e.target.value)}
                          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                        />
                        <div
                          className="w-4 h-4 border border-neutral-900/10 dark:border-neutral-100/30"
                          style={{ backgroundColor: bgColor }}
                        />
                      </label>
                    </div>
                  </div>
                </div>

              </div>

              {/* Sizing Export Standard (Brutalist blocks) */}
              <div className="space-y-2 pt-4 border-t border-neutral-900/10 dark:border-neutral-800">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">
                    Export Grid Scale
                  </label>
                  <span className="text-[10px] font-mono font-bold text-neutral-900 dark:text-neutral-100 bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 px-2 py-0.5">
                    {size} × {size} pixels (PNG)
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {SIZE_PRESETS.map((preset) => {
                    const isSelected = size === preset.value;
                    return (
                      <button
                        key={preset.label}
                        onClick={() => setSize(preset.value)}
                        className={`p-3 border-2 text-left transition-all rounded-none uppercase cursor-pointer ${
                          isSelected
                            ? "bg-neutral-900 dark:bg-white border-neutral-900 dark:border-white text-white dark:text-neutral-900 shadow-[3px_3px_0px_rgba(0,0,0,0.15)] dark:shadow-[3px_3px_0px_rgba(255,255,255,0.2)]"
                            : "bg-white dark:bg-neutral-800/80 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-neutral-900 dark:hover:border-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-750"
                        }`}
                      >
                        <div className="text-[11px] font-black tracking-tight">{preset.label}</div>
                        <div className={`text-[9px] font-mono mt-1 ${isSelected ? "text-neutral-300 dark:text-neutral-600" : "text-neutral-400 dark:text-neutral-500"}`}>
                          {preset.value}px
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Error Correction Density */}
              <div className="space-y-2 pt-4 border-t border-neutral-900/10 dark:border-neutral-800">
                <label className="block text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-1">
                  Redundancy Error Correction
                </label>
                <div className="grid grid-cols-4 gap-2 bg-neutral-100 dark:bg-neutral-800/80 p-1 border-2 border-neutral-200 dark:border-neutral-700">
                  {(["L", "M", "Q", "H"] as const).map((level) => {
                    const details = {
                      L: { title: "Level L", pct: "7%" },
                      M: { title: "Level M", pct: "15%" },
                      Q: { title: "Level Q", pct: "25%" },
                      H: { title: "Level H", pct: "30%" },
                    }[level];

                    const isSelected = errorCorrection === level;

                    return (
                      <button
                        key={level}
                        onClick={() => setErrorCorrection(level)}
                        className={`py-2 text-[10px] font-bold transition-all text-center rounded-none uppercase cursor-pointer ${
                          isSelected
                            ? "bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white border border-neutral-900 dark:border-neutral-500 shadow-[1px_1px_0px_rgba(0,0,0,0.15)] dark:shadow-[1px_1px_0px_rgba(255,255,255,0.15)]"
                            : "text-neutral-400 dark:text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                        }`}
                      >
                        {details.title} <span className="font-medium text-[9px]">({details.pct})</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-neutral-400 dark:text-neutral-500 leading-normal font-medium">
                  Level H protects your output with 30% redundancy blocks, ensuring scans work flawlessly even if partially covered or printed on uneven material.
                </p>
              </div>

              {/* Center Logo / Personalized Badge Selector */}
              <LogoSelector
                logo={logo}
                onChange={handleLogoChange}
                qrColor={qrColor}
                bgColor={bgColor}
                theme={theme}
              />

            </div>

          </div>
        </main>

        {/* Right Side: Result Output Workspace with styled background */}
        <section
          onWheel={(e) => {
            // Forward mouse wheel scrolling over the fixed right panel to the left parameters panel on desktop
            if (leftPanelRef.current && window.innerWidth >= 1024) {
              leftPanelRef.current.scrollBy({ top: e.deltaY, behavior: "auto" });
            }
          }}
          className="w-full lg:w-1/2 bg-neutral-100 dark:bg-neutral-950 flex flex-col items-center justify-center p-6 sm:p-8 lg:p-8 xl:p-12 relative border-t lg:border-t-0 lg:border-l border-neutral-900/10 dark:border-neutral-800 transition-colors lg:h-full lg:overflow-y-auto custom-scrollbar"
        >
          
          {/* Radial Dotted Grid Decoration matching theme */}
          <div
            className="absolute inset-0 opacity-[0.03] dark:opacity-[0.07] pointer-events-none"
            style={{
              backgroundImage: theme === "dark" ? "radial-gradient(#ffffff 1px, transparent 1px)" : "radial-gradient(#000000 1px, transparent 1px)",
              backgroundSize: "20px 20px"
            }}
          />
          
          <div className="relative group z-10 w-full max-w-md flex flex-col items-center my-auto">
            
            {/* Real QR Box - Geometric Balance styled container */}
            <div className="w-64 h-64 sm:w-72 sm:h-72 xl:w-80 xl:h-80 bg-white dark:bg-neutral-900 border-2 border-neutral-900 dark:border-neutral-100 p-5 sm:p-6 xl:p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,0.05)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,0.05)] flex flex-col items-center justify-center transition-all">
              <div className="w-full h-full border-4 border-neutral-900 dark:border-neutral-100 relative p-1 flex items-center justify-center">
                
                <AnimatePresence mode="wait">
                  {url.trim() ? (
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
                          alt="QR Vector"
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
                      <p className="text-[11px] font-bold text-neutral-900 dark:text-white uppercase tracking-wider">Awaiting Link</p>
                      <p className="text-[9px] text-neutral-400 dark:text-neutral-500 font-mono mt-1 uppercase max-w-[150px] mx-auto">
                        Insert destination input to draw vector grid.
                      </p>
                    </div>
                  )}
                </AnimatePresence>

              </div>
            </div>

            {/* Error notifications container */}
            {errorMessage && (
              <div className="mt-6 w-full p-3 border-2 border-red-900 dark:border-red-600 bg-red-50 dark:bg-red-950/40 flex gap-2 text-red-900 dark:text-red-300 text-xs rounded-none font-mono">
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
                <button
                  id="download-qr-btn"
                  onClick={handleDownload}
                  disabled={!qrDataUrl || !!errorMessage}
                  className={`flex-1 px-4 py-3.5 font-bold uppercase tracking-wider text-xs font-mono flex items-center justify-center gap-1.5 rounded-none transition-all whitespace-nowrap ${
                    qrDataUrl && !errorMessage
                      ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 active:translate-x-[2px] active:translate-y-[2px] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] border-2 border-neutral-900 dark:border-white cursor-pointer"
                      : "bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600 border border-neutral-300 dark:border-neutral-700 cursor-not-allowed"
                  }`}
                  title="Download PNG image file"
                >
                  <span>Download</span>
                  <Download className="w-3.5 h-3.5" />
                </button>

                <button
                  id="copy-qr-btn"
                  onClick={handleCopy}
                  disabled={!qrDataUrl || !!errorMessage}
                  className={`flex-1 px-4 py-3.5 font-bold uppercase tracking-wider text-xs font-mono flex items-center justify-center gap-1.5 rounded-none transition-all whitespace-nowrap ${
                    qrDataUrl && !errorMessage
                      ? "bg-white dark:bg-neutral-900 border-2 border-neutral-900 dark:border-neutral-100 text-neutral-900 dark:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800 active:translate-x-[2px] active:translate-y-[2px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.7)] cursor-pointer"
                      : "bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-300 dark:text-neutral-700 cursor-not-allowed"
                  }`}
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
                  onClick={handleShare}
                  disabled={!qrDataUrl || !!errorMessage}
                  className={`flex-1 px-4 py-3.5 font-bold uppercase tracking-wider text-xs font-mono flex items-center justify-center gap-1.5 rounded-none transition-all whitespace-nowrap ${
                    qrDataUrl && !errorMessage
                      ? "bg-white dark:bg-neutral-900 border-2 border-neutral-900 dark:border-neutral-100 text-neutral-900 dark:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800 active:translate-x-[2px] active:translate-y-[2px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.7)] cursor-pointer"
                      : "bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-300 dark:text-neutral-700 cursor-not-allowed"
                  }`}
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
        </section>

      </div>

      {/* Geometric Balance - Footer Status bar */}
      <footer className="h-14 border-t border-neutral-900/10 dark:border-neutral-800 px-6 sm:px-12 flex flex-col sm:flex-row items-center justify-between bg-white dark:bg-neutral-950 text-[10px] font-mono text-neutral-400 dark:text-neutral-500 uppercase tracking-widest gap-2 py-4 sm:py-0 transition-colors flex-shrink-0 z-30">
        <div className="flex gap-6">
          <span>Local Time: {new Date().toLocaleTimeString()}</span>
        </div>
        <div className="flex gap-6">
          <span>Standard: ISO/IEC 18004</span>
          <span>License: Open // Stable</span>
        </div>
      </footer>

      {/* History Slide-over Sidebar */}
      <HistorySidebar
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        currentUrl={url}
        onRestore={handleRestoreHistory}
        onRemove={handleRemoveHistoryItem}
        onClear={handleClearHistory}
      />

    </div>
  );
}

