/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useMemo, type WheelEvent } from "react";
import SiteHeader from "./components/SiteHeader";
import GeneratorPanel from "./components/GeneratorPanel";
import PreviewPanel from "./components/PreviewPanel";
import StatusBar from "./components/StatusBar";
import SeoSections from "./components/SeoSections";
import SiteFooter from "./components/SiteFooter";
import HistorySidebar from "./components/HistorySidebar";
import { ContentType, LogoConfig, QrHistoryItem, WifiConfig } from "./types";
import { generateQrCode } from "./utils/qrGenerator";
import { generateQrSvg } from "./utils/qrSvg";
import { buildQrContent } from "./utils/qrContent";
import { PRESET_LOGOS, createPresetSvgDataUri, resolvePresetIconColor } from "./utils/presetLogos";
import { storageGet, storageRemove, storageSet } from "./utils/storage";

const DEFAULT_WIFI: WifiConfig = {
  ssid: "",
  password: "",
  security: "WPA",
  hidden: false,
};

/**
 * A history entry is only persisted when it cannot contain a Wi-Fi password:
 * entries typed as `wifi`, and legacy entries whose `url` holds a raw
 * `WIFI:...` payload, are dropped (both on load and on save).
 */
function isStorableHistoryItem(item: unknown): boolean {
  if (!item || typeof item !== "object") return false;
  const candidate = item as QrHistoryItem;
  if (candidate.contentType === "wifi") return false;
  if (typeof candidate.url === "string" && candidate.url.trim().toUpperCase().startsWith("WIFI:")) {
    return false;
  }
  return true;
}

/** Placeholder shown until the user generates their own codes. */
function createSeedHistory(): QrHistoryItem[] {
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
      contentType: "url",
    },
  ];
}

const EMPTY_STATES: Record<ContentType, { title: string; hint: string }> = {
  url: { title: "Awaiting Link", hint: "Insert destination input to draw vector grid." },
  text: { title: "Awaiting Text", hint: "Enter text to draw vector grid." },
  wifi: { title: "Awaiting Network", hint: "Enter an SSID to draw vector grid." },
};

export default function App() {
  const leftPanelRef = useRef<HTMLElement>(null);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      const saved = storageGet("hk_qr_theme");
      if (saved === "light" || saved === "dark") return saved;
      if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        return "dark";
      }
    }
    return "light";
  });

  const [contentType, setContentType] = useState<ContentType>("url");
  const [url, setUrl] = useState<string>("https://ai.studio/build");
  const [text, setText] = useState<string>("");
  const [wifi, setWifi] = useState<WifiConfig>(DEFAULT_WIFI);
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
    if (typeof window === "undefined") return createSeedHistory();

    const saved = storageGet("hk_qr_history");
    if (!saved) return createSeedHistory();

    try {
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return createSeedHistory();

      // Drop any Wi-Fi entries (and the passwords they carry) that older
      // versions may have written, then persist the cleaned list.
      const cleaned = parsed.filter(isStorableHistoryItem);
      if (cleaned.length !== parsed.length) {
        storageSet("hk_qr_history", JSON.stringify(cleaned));
      }

      if (cleaned.length > 0) return cleaned.slice(0, 5);
      // Everything was Wi-Fi and got dropped — show an empty drawer.
      return parsed.length > 0 ? [] : createSeedHistory();
    } catch (e) {
      console.error("Error reading qr history", e);
      return createSeedHistory();
    }
  });

  /** The exact string encoded into the QR matrix for the active content type. */
  const content = useMemo(
    () => buildQrContent({ contentType, url, text, wifi }),
    [contentType, url, text, wifi]
  );

  const hasContent =
    contentType === "url"
      ? !!url.trim()
      : contentType === "text"
        ? !!text.trim()
        : !!wifi.ssid.trim();

  /** Human-readable label used for the preview alt text and share messages. */
  const previewLabel =
    contentType === "url" ? url.trim() : contentType === "text" ? text.trim() : wifi.ssid.trim();

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
    const restoredType: ContentType = item.contentType ?? "url";
    setContentType(restoredType);

    if (restoredType === "text") {
      setText(item.url);
    } else if (restoredType === "wifi") {
      if (item.wifi) setWifi(item.wifi);
    } else {
      setUrl(item.url);
    }

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
      storageSet("hk_qr_history", JSON.stringify(updated));
      return updated;
    });
  };

  const handleClearHistory = () => {
    setHistory([]);
    storageRemove("hk_qr_history");
  };

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    storageSet("hk_qr_theme", theme);
  }, [theme]);

  // Generate QR code with options and center logo
  useEffect(() => {
    let active = true;

    if (!hasContent) {
      setQrDataUrl("");
      setIsGenerating(false);
      return;
    }

    setIsGenerating(true);

    const generate = async () => {
      try {
        const startTime = Date.now();
        const dataUrl = await generateQrCode({
          url: content,
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

          // Update recent history with the generated QR code (last 5 entries).
          // Wi-Fi codes are never stored: their payload embeds the network
          // password, which must not be persisted to localStorage.
          if (content.trim().length >= 3 && contentType !== "wifi") {
            setHistory((prev) => {
              const cleanUrl = content.trim();
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
                contentType,
              };
              const updated = [newItem, ...filtered].slice(0, 5);
              storageSet("hk_qr_history", JSON.stringify(updated));
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
  }, [content, hasContent, qrColor, bgColor, size, errorCorrection, logo, contentType, wifi]);

  /** Hostname-based file name prefix (falls back to the content type). */
  const getFileBaseName = () => {
    if (contentType === "url") {
      try {
        const parsedUrl = url.startsWith("http") ? url : `https://${url}`;
        const hostname = new URL(parsedUrl).hostname;
        return hostname.replace("www.", "").split(".")[0] || "qrcode";
      } catch {
        return "qrcode";
      }
    }
    return contentType === "wifi" ? "wifi" : "text";
  };

  /** The normalized destination, only meaningful for the URL content type. */
  const getShareableUrl = () => {
    if (contentType !== "url" || !url.trim()) return "";
    return url.startsWith("http") ? url : `https://${url}`;
  };

  // Download QR code as PNG file
  const handleDownload = () => {
    if (!qrDataUrl) return;

    const link = document.createElement("a");
    link.download = `${getFileBaseName()}_matrix_${size}x${size}.png`;
    link.href = qrDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download the same matrix as a scalable SVG file
  const handleDownloadSvg = () => {
    if (!qrDataUrl) return;

    try {
      const svg = generateQrSvg({
        content,
        size,
        qrColor,
        bgColor,
        errorCorrection,
        logo,
      });

      const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
      const objectUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.download = `${getFileBaseName()}_matrix_${size}x${size}.svg`;
      link.href = objectUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.message || "Failed to export SVG. Try other values.");
    }
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
        await navigator.clipboard.writeText(getShareableUrl() || content);
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

    const baseName = getFileBaseName();
    const fileName = `${baseName}_matrix_${size}x${size}.png`;
    const shareTitle = `${baseName} QR Code`;
    const shareUrl = getShareableUrl();
    const isLink = contentType === "url";
    const shareText = isLink
      ? `QR Code pointing to ${shareUrl}`
      : `QR Code: ${content}`;

    try {
      const file = dataURLtoFile(qrDataUrl, fileName);

      // 1. Try sharing the actual QR image file via Web Share API Level 2
      if (typeof navigator !== "undefined" && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: shareTitle,
          text: shareText,
          ...(shareUrl ? { url: shareUrl } : {}),
        });
        setShareStatus("shared");
        setTimeout(() => setShareStatus("idle"), 2500);
        return;
      }

      // 2. Try standard Web Share API with text & URL if file sharing is not supported by this browser
      if (typeof navigator !== "undefined" && navigator.share && isLink) {
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
      await navigator.clipboard.writeText(shareUrl || content);
      setShareStatus("copied");
      setShareFeedback(
        `Web Share unsupported on this browser. ${isLink ? "Link" : "Content"} copied to clipboard!`
      );
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
        await navigator.clipboard.writeText(shareUrl || content);
        setShareStatus("copied");
        setShareFeedback(`${isLink ? "Link" : "Content"} copied to clipboard!`);
        setTimeout(() => {
          setShareStatus("idle");
          setShareFeedback(null);
        }, 3000);
      } catch {
        // Fallback copy failed
      }
    }
  };

  // Clear whatever the active content type is currently holding
  const handleClearInput = () => {
    if (contentType === "url") setUrl("");
    else if (contentType === "text") setText("");
    else setWifi(DEFAULT_WIFI);
  };

  // Forward mouse wheel scrolling over the fixed right panel to the left parameters panel on desktop
  const handleWheel = (e: WheelEvent<HTMLElement>) => {
    if (leftPanelRef.current && window.innerWidth >= 1024) {
      leftPanelRef.current.scrollBy({ top: e.deltaY, behavior: "auto" });
    }
  };

  const emptyState = EMPTY_STATES[contentType];

  return (
    <div className={`min-h-screen ${theme === "dark" ? "dark" : ""} bg-neutral-50 dark:bg-neutral-950 flex flex-col font-sans overflow-x-hidden selection:bg-neutral-900 selection:text-white dark:selection:bg-white dark:selection:text-neutral-900 transition-colors duration-150`}>

      {/* Geometric Balance - Header Block */}
      <SiteHeader
        theme={theme}
        onThemeChange={setTheme}
        isGenerating={isGenerating}
        historyCount={history.length}
        onOpenHistory={() => setIsHistoryOpen(true)}
      />

      {/* Main Workspace Split Layout — locked to the space between the header
          (h-20) and status bar (h-14) on desktop so panels scroll internally;
          SEO content sections follow below the fold. */}
      <div className="flex flex-col lg:flex-row lg:overflow-hidden min-h-0 lg:h-[calc(100vh_-_8.5rem)]">

        {/* Left Side: Parameters Panel */}
        <GeneratorPanel
          panelRef={leftPanelRef}
          theme={theme}
          contentType={contentType}
          onContentTypeChange={setContentType}
          url={url}
          onUrlChange={setUrl}
          text={text}
          onTextChange={setText}
          wifi={wifi}
          onWifiChange={setWifi}
          qrColor={qrColor}
          onQrColorChange={setQrColor}
          bgColor={bgColor}
          onBgColorChange={setBgColor}
          size={size}
          onSizeChange={setSize}
          errorCorrection={errorCorrection}
          onErrorCorrectionChange={setErrorCorrection}
          logo={logo}
          onLogoChange={handleLogoChange}
          historyCount={history.length}
          onOpenHistory={() => setIsHistoryOpen(true)}
          onClearInput={handleClearInput}
        />

        {/* Right Side: Result Output Workspace with styled background */}
        <PreviewPanel
          theme={theme}
          onWheel={handleWheel}
          qrDataUrl={qrDataUrl}
          bgColor={bgColor}
          errorMessage={errorMessage}
          hasContent={hasContent}
          emptyTitle={emptyState.title}
          emptyHint={emptyState.hint}
          previewLabel={previewLabel}
          size={size}
          errorCorrection={errorCorrection}
          logo={logo}
          copied={copied}
          shareStatus={shareStatus}
          shareFeedback={shareFeedback}
          onDownload={handleDownload}
          onDownloadSvg={handleDownloadSvg}
          onCopy={handleCopy}
          onShare={handleShare}
        />

      </div>

      {/* Geometric Balance - Footer Status bar */}
      <StatusBar />

      {/* Below-the-fold crawlable content (features / how-to / FAQ) */}
      <SeoSections />

      {/* Site footer */}
      <SiteFooter />

      {/* History Slide-over Sidebar */}
      <HistorySidebar
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        currentUrl={content}
        onRestore={handleRestoreHistory}
        onRemove={handleRemoveHistoryItem}
        onClear={handleClearHistory}
      />

    </div>
  );
}
