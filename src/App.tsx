/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from "react";
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
import { DEFAULT_URL } from "./data/presets";
import { storageGet, storageRemove, storageSet } from "./utils/storage";

/**
 * The storage keys are intentionally NOT renamed with the package: they carry
 * the old `hk_qr_` prefix on purpose, so existing users keep their saved
 * history and theme instead of being orphaned by the rename to `freesubqr`.
 */
const HISTORY_STORAGE_KEY = "hk_qr_history";
const THEME_STORAGE_KEY = "hk_qr_theme";

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

/**
 * De-duplication rule: URLs are compared case-insensitively (host names are
 * case-insensitive), plain text exactly as typed.
 */
function isSameHistoryPayload(a: QrHistoryItem, b: QrHistoryItem): boolean {
  if ((a.contentType ?? "url") !== (b.contentType ?? "url")) return false;
  const left = a.url.trim();
  const right = b.url.trim();
  if ((a.contentType ?? "url") === "text") return left === right;
  return left.toLowerCase() === right.toLowerCase();
}

/**
 * History-size guard: uploaded logos are re-encoded from a canvas so a saved
 * entry never carries a multi-megabyte data URL (max 256px per side).
 *
 * The original uploaded logo is preserved for the current editing session —
 * the caller keeps the `logo` state untouched and only passes `src` here to
 * obtain the copy written to history.
 *
 * Returns `null` when a safe, small copy cannot be produced (image load
 * failure, missing canvas context, tainted canvas, or encoding failure).
 * Callers must not fall back to the original `src`, otherwise an oversized
 * original could silently enter localStorage.
 */
export async function downscaleLogoForHistory(src: string): Promise<string | null> {
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext?.("2d");
    if (!ctx) return null;

    const image = new Image();
    image.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("logo image failed to load"));
      image.src = src;
    });

    const longest = Math.max(image.naturalWidth || 1, image.naturalHeight || 1);
    if (longest <= 256) return src;

    const scale = 256 / longest;
    canvas.width = Math.round((image.naturalWidth || 256) * scale);
    canvas.height = Math.round((image.naturalHeight || 256) * scale);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    const downscaled = canvas.toDataURL("image/png");
    if (!downscaled || downscaled.length < 100) return null;
    return downscaled;
  } catch {
    return null;
  }
}

/** Reads stored history, purging any Wi-Fi entries older versions saved. */
function loadHistory(): QrHistoryItem[] {
  const saved = storageGet(HISTORY_STORAGE_KEY);
  if (!saved) return [];

  try {
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];

    // Drop any Wi-Fi entries (and the passwords they carry) that older
    // versions may have written, then persist the cleaned list.
    const cleaned = parsed.filter(isStorableHistoryItem);
    if (cleaned.length !== parsed.length) {
      storageSet(HISTORY_STORAGE_KEY, JSON.stringify(cleaned));
    }

    return cleaned.slice(0, 5);
  } catch (e) {
    console.error("Error reading qr history", e);
    return [];
  }
}

const EMPTY_STATES: Record<ContentType, { title: string; hint: string }> = {
  url: { title: "Awaiting Link", hint: "Insert destination input to draw vector grid." },
  text: { title: "Awaiting Text", hint: "Enter text to draw vector grid." },
  wifi: { title: "Awaiting Network", hint: "Enter an SSID to draw vector grid." },
};

export default function App() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      const saved = storageGet(THEME_STORAGE_KEY);
      if (saved === "light" || saved === "dark") return saved;
      if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        return "dark";
      }
    }
    return "light";
  });

  const [contentType, setContentType] = useState<ContentType>("url");
  const [url, setUrl] = useState<string>(DEFAULT_URL);
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
  const [history, setHistory] = useState<QrHistoryItem[]>(() => loadHistory());
  const [historyNotice, setHistoryNotice] = useState<string | null>(null);

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
  }, [qrColor, bgColor, logo?.presetId, logo?.bgColor, logo?.iconColor, logo?.src]);

  /**
   * Badge base background follows the pattern background — but only while the
   * badge is in "match pattern" mode (its default). A badge color the user
   * explicitly picked stays fixed when the pattern background changes.
   */
  useEffect(() => {
    setLogo((prev) => {
      if (
        prev?.enabled &&
        prev.badgeBgMode !== "custom" &&
        prev.bgColor !== bgColor
      ) {
        return { ...prev, bgColor };
      }
      // Nothing changed — skip the update entirely.
      return prev;
    });
  }, [bgColor]);

  /**
   * Legacy history logos saved before `badgeBgMode` existed had no flag;
   * infer it from the stored snapshot: a badge color equal to the item's
   * pattern background was followed by the old sync effect, anything else
   * was a fixed color that must be preserved.
   */
  const withInferredBadgeMode = (logo: LogoConfig, patternBg: string): LogoConfig => {
    if (logo.badgeBgMode) return logo;
    const mode = logo.bgColor && patternBg ? (logo.bgColor === patternBg ? "pattern" : "custom") : "pattern";
    return { ...logo, badgeBgMode: mode };
  };

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
      setLogo(withInferredBadgeMode(item.logo, item.bgColor));
    } else {
      setLogo(null);
    }
    setIsHistoryOpen(false);
  };

  const handleRemoveHistoryItem = (id: string) => {
    const updated = history.filter((item) => item.id !== id);
    setHistory(updated);
    if (!storageSet(HISTORY_STORAGE_KEY, JSON.stringify(updated))) {
      setHistoryNotice(
        "Couldn't save the history change — browser storage is unavailable or full."
      );
      window.setTimeout(() => setHistoryNotice(null), 8000);
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
    storageRemove(HISTORY_STORAGE_KEY);
  };

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    storageSet(THEME_STORAGE_KEY, theme);
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
    }, 120);

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

  /**
   * Records the current code in history — called only after a successful
   * export (Download PNG, Download SVG, Copy, Share), so intermediate typing
   * states never end up in the list. `isStorableHistoryItem` guards the save
   * path too: Wi-Fi payloads embed the network password and are never stored.
   * Uploaded logos are downscaled to ≤256px so a stored entry stays small.
   */
  const recordHistory = async () => {
    const payload = content.trim();
    if (payload.length < 3) return;

    let savedLogo: LogoConfig | null =
      logo && logo.enabled && logo.src ? { ...logo } : null;
    if (savedLogo?.type === "upload") {
      const optimized = await downscaleLogoForHistory(savedLogo.src);
      // Never let an oversized original enter localStorage. If optimization
      // fails, drop the badge from the history entry: the entry itself (URL,
      // colours, size) is still preserved, and the session logo stays intact
      // in the editor.
      savedLogo = optimized ? { ...savedLogo, src: optimized } : null;
    }

    const newItem: QrHistoryItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      url: payload,
      timestamp: Date.now(),
      qrColor,
      bgColor,
      size,
      errorCorrection: logo?.enabled && logo.src ? "H" : errorCorrection,
      logo: savedLogo,
      contentType,
    };

    if (!isStorableHistoryItem(newItem)) return;

    const updated = [
      newItem,
      ...history.filter((item) => !isSameHistoryPayload(item, newItem)),
    ].slice(0, 5);
    setHistory(updated);

    if (!storageSet(HISTORY_STORAGE_KEY, JSON.stringify(updated))) {
      setHistoryNotice(
        "Couldn't save this code to history — browser storage is unavailable or full."
      );
      window.setTimeout(() => setHistoryNotice(null), 8000);
    }
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
    recordHistory();
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
      recordHistory();
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
      recordHistory();
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn("ClipboardItem write failed, falling back to copy string URL", err);
      try {
        await navigator.clipboard.writeText(getShareableUrl() || content);
        setCopied(true);
        recordHistory();
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
    // Clipboard fallback copy: a Wi-Fi payload embeds the network password,
    // so say that explicitly instead of a generic "copied" note.
    const copiedMessage =
      contentType === "wifi"
        ? "Wi-Fi join payload copied to clipboard — it includes your network password!"
        : `${isLink ? "Link" : "Content"} copied to clipboard!`;

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
        recordHistory();
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
        recordHistory();
        setShareStatus("shared");
        setTimeout(() => setShareStatus("idle"), 2500);
        return;
      }

      // 3. Graceful fallback if Web Share is unsupported in this environment (e.g. desktop non-compatible)
      await navigator.clipboard.writeText(shareUrl || content);
      recordHistory();
      setShareStatus("copied");
      setShareFeedback(`Web Share unsupported on this browser. ${copiedMessage}`);
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
        recordHistory();
        setShareStatus("copied");
        setShareFeedback(copiedMessage);
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

      {/* Main Workspace Split Layout */}
      <div className="flex flex-col lg:flex-row min-h-0">

        {/* Left Side: Parameters Panel */}
        <GeneratorPanel
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

      {/* History storage warning: visible, politely announced status notice */}
      {historyNotice && (
        <div
          role="status"
          className="text-xs font-mono text-neutral-900 dark:text-neutral-100 bg-amber-100 dark:bg-amber-900/40 border-t border-amber-700/40 dark:border-amber-400/40 px-6 py-2.5"
        >
          {historyNotice}
        </div>
      )}

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
