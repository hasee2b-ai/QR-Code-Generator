import { useId } from "react";
import { Check, Globe, Trash2, History, Link2, Type, Wifi } from "lucide-react";
import LogoSelector from "./LogoSelector";
import { ContentType, ErrorCorrectionLevel, LogoConfig, WifiConfig } from "../types";
import { BACK_COLOR_PRESETS, FOR_COLOR_PRESETS, SIZE_PRESETS, TEST_PRESETS } from "../data/presets";
import { isValidUrl } from "../utils/qrContent";

interface GeneratorPanelProps {
  theme: "light" | "dark";
  contentType: ContentType;
  onContentTypeChange: (contentType: ContentType) => void;
  url: string;
  onUrlChange: (url: string) => void;
  text: string;
  onTextChange: (text: string) => void;
  wifi: WifiConfig;
  onWifiChange: (wifi: WifiConfig) => void;
  qrColor: string;
  onQrColorChange: (qrColor: string) => void;
  bgColor: string;
  onBgColorChange: (bgColor: string) => void;
  size: number;
  onSizeChange: (size: number) => void;
  errorCorrection: ErrorCorrectionLevel;
  onErrorCorrectionChange: (errorCorrection: ErrorCorrectionLevel) => void;
  logo: LogoConfig | null;
  onLogoChange: (logo: LogoConfig | null) => void;
  historyCount: number;
  onOpenHistory: () => void;
  onClearInput: () => void;
}

const CONTENT_TYPES: { id: ContentType; label: string; icon: typeof Link2 }[] = [
  { id: "url", label: "URL", icon: Link2 },
  { id: "text", label: "Text", icon: Type },
  { id: "wifi", label: "Wi-Fi", icon: Wifi },
];

const WIFI_SECURITY_OPTIONS: { id: "WPA" | "WEP" | "nopass"; label: string }[] = [
  { id: "WPA", label: "WPA/WPA2" },
  { id: "WEP", label: "WEP" },
  { id: "nopass", label: "Open" },
];

export default function GeneratorPanel({
  theme,
  contentType,
  onContentTypeChange,
  url,
  onUrlChange,
  text,
  onTextChange,
  wifi,
  onWifiChange,
  qrColor,
  onQrColorChange,
  bgColor,
  onBgColorChange,
  size,
  onSizeChange,
  errorCorrection,
  onErrorCorrectionChange,
  logo,
  onLogoChange,
  historyCount,
  onOpenHistory,
  onClearInput,
}: GeneratorPanelProps) {
  // Every <label> is linked to its control via htmlFor/id (useId keeps the
  // ids unique across renders); captions over button groups become group
  // labels via role="group" + aria-labelledby.
  const contentTypeLabelId = useId();
  const urlInputId = useId();
  const textInputId = useId();
  const wifiSectionLabelId = useId();
  const ssidInputId = useId();
  const securityLabelId = useId();
  const hiddenNetworkLabelId = useId();
  const qrColorLabelId = useId();
  const qrColorInputId = useId();
  const bgColorLabelId = useId();
  const bgColorInputId = useId();
  const sizeLabelId = useId();
  const errorCorrectionLabelId = useId();

  // Auto-protocol hint / validation dot only apply to the URL content type.
  const needsProtocol = contentType === "url" && !!url && !/^https?:\/\//i.test(url);
  const urlIsValid = contentType === "url" && isValidUrl(url);

  const hasInputValue =
    contentType === "url" ? !!url : contentType === "text" ? !!text : !!(wifi.ssid || wifi.password);

  const labelActions = (
    <div className="flex items-center gap-3">
      {historyCount > 0 && (
        <button
          type="button"
          onClick={onOpenHistory}
          className="text-[10px] font-bold text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors uppercase tracking-widest flex items-center gap-1 cursor-pointer"
          title="View recent generated codes"
        >
          <History className="w-3 h-3" />
          Recent ({historyCount})
        </button>
      )}
      {hasInputValue && (
        <button
          type="button"
          onClick={onClearInput}
          className="text-[10px] font-bold text-neutral-400 hover:text-neutral-900 dark:text-neutral-500 dark:hover:text-white transition-colors uppercase tracking-widest flex items-center gap-1.5 cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear Input
        </button>
      )}
    </div>
  );

  return (
    <main
      id="generator"
      aria-label="QR code generator"
      className="w-full lg:w-1/2 border-r border-neutral-900/10 dark:border-neutral-800 p-6 sm:p-12 lg:p-12 xl:p-16 flex flex-col justify-start bg-white dark:bg-neutral-900 transition-colors scroll-mt-20"
    >
      <div className="max-w-xl w-full mx-auto pb-12 lg:pb-16">

        {/* Title / Hero section strictly following theme design */}
        <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-2 block">
          Free · Instant · No Sign-up
        </span>
        <h1 className="text-4xl sm:text-5xl font-black text-neutral-900 dark:text-white leading-none mb-4 uppercase tracking-tight italic font-display" style={{ wordSpacing: "0.1em" }}>
          Free QR Code<br />Generator
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 mb-10 leading-relaxed text-sm sm:text-base">
          Turn any link into a scannable QR code in seconds. Customize colors, size and error
          correction, add your logo, then download a print-ready PNG up to 3000&nbsp;×&nbsp;3000&nbsp;px.
          Free and private — everything is generated locally in your browser.
        </p>

        {/* Input & Form Area */}
        <div className="space-y-6">

          {/* Content type switcher: URL / Text / Wi-Fi */}
          <div className="space-y-2">
            <span
              id={contentTypeLabelId}
              className="block text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest"
            >
              Content Type
            </span>
            <div
              role="group"
              aria-labelledby={contentTypeLabelId}
              className="flex border-2 border-neutral-900 dark:border-neutral-200 p-0.5 bg-neutral-100 dark:bg-neutral-950"
            >
              {CONTENT_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = contentType === type.id;

                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => onContentTypeChange(type.id)}
                    aria-pressed={isSelected}
                    aria-label={`${type.label} content type`}
                    className={`flex-1 py-2 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]"
                        : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {type.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Destination Link Input */}
          {contentType === "url" && (
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor={urlInputId}
                  className="block text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest"
                >
                  Source Destination URL
                </label>
                {labelActions}
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-neutral-400 dark:text-neutral-500">
                  <Globe className="w-4 h-4" />
                </div>
                <input
                  id={urlInputId}
                  type="text"
                  placeholder="e.g. google.com or your-destination-link"
                  value={url}
                  onChange={(e) => onUrlChange(e.target.value)}
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
                        onClick={() => onUrlChange(p.url)}
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
          )}

          {/* Plain text input */}
          {contentType === "text" && (
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor={textInputId}
                  className="block text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest"
                >
                  Text Content
                </label>
                {labelActions}
              </div>

              <textarea
                id={textInputId}
                rows={4}
                placeholder="e.g. Meet me at the main entrance at 7pm"
                value={text}
                onChange={(e) => onTextChange(e.target.value)}
                className="w-full px-4 py-4 bg-white dark:bg-neutral-950 border-2 border-neutral-900 dark:border-neutral-200 font-mono text-sm focus:outline-none focus:ring-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.7)] rounded-none text-neutral-900 dark:text-white placeholder:text-neutral-300 dark:placeholder:text-neutral-600 transition-all duration-200 resize-y"
              />

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                <span className="text-neutral-400 dark:text-neutral-500 font-medium">
                  {text.length} character{text.length === 1 ? "" : "s"} // Encodes raw text into the matrix
                </span>
              </div>
            </div>
          )}

          {/* Wi-Fi network input */}
          {contentType === "wifi" && (
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <label
                  id={wifiSectionLabelId}
                  htmlFor={ssidInputId}
                  className="block text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest"
                >
                  Wi-Fi Network
                </label>
                {labelActions}
              </div>

              <div role="group" aria-labelledby={wifiSectionLabelId} className="space-y-3">
                <input
                  id={ssidInputId}
                  type="text"
                  aria-label="Network name (SSID)"
                  placeholder="Network name (SSID)"
                  value={wifi.ssid}
                  onChange={(e) => onWifiChange({ ...wifi, ssid: e.target.value })}
                  className="w-full px-4 py-3.5 bg-white dark:bg-neutral-950 border-2 border-neutral-900 dark:border-neutral-200 font-mono text-sm focus:outline-none focus:ring-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.7)] rounded-none text-neutral-900 dark:text-white placeholder:text-neutral-300 dark:placeholder:text-neutral-600 transition-all duration-200"
                />

                <input
                  type="text"
                  aria-label="Network password"
                  placeholder={wifi.security === "nopass" ? "Open network — no password" : "Network password"}
                  value={wifi.password}
                  disabled={wifi.security === "nopass"}
                  onChange={(e) => onWifiChange({ ...wifi, password: e.target.value })}
                  className="w-full px-4 py-3.5 bg-white dark:bg-neutral-950 border-2 border-neutral-900 dark:border-neutral-200 font-mono text-sm focus:outline-none focus:ring-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.7)] rounded-none text-neutral-900 dark:text-white placeholder:text-neutral-300 dark:placeholder:text-neutral-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <span
                      id={securityLabelId}
                      className="block text-[9px] font-mono font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-1.5"
                    >
                      Security
                    </span>
                    <div
                      role="group"
                      aria-labelledby={securityLabelId}
                      className="grid grid-cols-3 gap-1.5"
                    >
                      {WIFI_SECURITY_OPTIONS.map((option) => {
                        const isSelected = wifi.security === option.id;
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() =>
                              onWifiChange({
                                ...wifi,
                                security: option.id,
                                password: option.id === "nopass" ? "" : wifi.password,
                              })
                            }
                            aria-pressed={isSelected}
                            className={`py-1.5 text-[9px] font-mono font-bold uppercase transition-all border cursor-pointer ${
                              isSelected
                                ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-neutral-900 dark:border-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                                : "bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700 hover:border-neutral-900 dark:hover:border-neutral-300"
                            }`}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div role="group" aria-labelledby={hiddenNetworkLabelId}>
                    <span
                      id={hiddenNetworkLabelId}
                      className="block text-[9px] font-mono font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-1.5"
                    >
                      Hidden Network
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={wifi.hidden}
                      onClick={() => onWifiChange({ ...wifi, hidden: !wifi.hidden })}
                      className={`w-full py-1.5 px-3 text-[9px] font-mono font-bold uppercase transition-all border cursor-pointer flex items-center justify-between gap-2 ${
                        wifi.hidden
                          ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-neutral-900 dark:border-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                          : "bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700 hover:border-neutral-900 dark:hover:border-neutral-300"
                      }`}
                    >
                      <span>{wifi.hidden ? "Hidden SSID" : "Broadcast SSID"}</span>
                      <span
                        className={`w-2.5 h-2.5 border ${
                          wifi.hidden
                            ? "bg-white dark:bg-neutral-900 border-white dark:border-neutral-900"
                            : "bg-transparent border-neutral-400 dark:border-neutral-600"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                  <span className="text-neutral-400 dark:text-neutral-500 font-medium">
                    {wifi.ssid.trim()
                      ? wifi.security === "nopass"
                        ? "Open network // Scanning connects without a password"
                        : "Ready to encode a Wi-Fi join payload"
                      : "Enter a network name to draw the vector grid"}
                  </span>
                </div>
              </div>
            </div>
          )}

        {/* Color matrix row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-neutral-900/10 dark:border-neutral-800">

          {/* Dark Code Matrix Color picker */}
          <div className="space-y-2">
            <label
              htmlFor={qrColorInputId}
              className="block text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest"
            >
              Matrix Block Color
            </label>
            <div className="flex items-center gap-2">
              <div className="flex flex-wrap items-center gap-1.5 flex-1">
                {FOR_COLOR_PRESETS.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => onQrColorChange(color.hex)}
                    className="w-8 h-8 border-2 border-neutral-900 dark:border-neutral-600 relative transition-transform active:scale-95 rounded-none cursor-pointer"
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
                <label
                  htmlFor={qrColorInputId}
                  className="relative w-8 h-8 border-2 border-neutral-900 dark:border-neutral-300 cursor-pointer overflow-hidden flex items-center justify-center bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors rounded-none"
                >
                  <input
                    id={qrColorInputId}
                    type="color"
                    value={qrColor}
                    onChange={(e) => onQrColorChange(e.target.value)}
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
            <label
              htmlFor={bgColorInputId}
              className="block text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest"
            >
              Pattern Background
            </label>
            <div className="flex items-center gap-2">
              <div className="flex flex-wrap items-center gap-1.5 flex-1">
                {BACK_COLOR_PRESETS.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => onBgColorChange(color.hex)}
                    className="w-8 h-8 border-2 border-neutral-300 dark:border-neutral-700 relative transition-transform active:scale-95 rounded-none cursor-pointer"
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
                <label
                  htmlFor={bgColorInputId}
                  className="relative w-8 h-8 border-2 border-neutral-900 dark:border-neutral-300 cursor-pointer overflow-hidden flex items-center justify-center bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors rounded-none"
                >
                  <input
                    id={bgColorInputId}
                    type="color"
                    value={bgColor}
                    onChange={(e) => onBgColorChange(e.target.value)}
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
              <span
                id={sizeLabelId}
                className="block text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest"
              >
                Export Grid Scale
              </span>
              <span className="text-[10px] font-mono font-bold text-neutral-900 dark:text-neutral-100 bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 px-2 py-0.5">
                {size} × {size} px (PNG + SVG)
              </span>
            </div>
            <div
              role="group"
              aria-labelledby={sizeLabelId}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3"
            >
              {SIZE_PRESETS.map((preset) => {
                const isSelected = size === preset.value;
                return (
                  <button
                    key={preset.label}
                    onClick={() => onSizeChange(preset.value)}
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
            <span
              id={errorCorrectionLabelId}
              className="block text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-1"
            >
              Redundancy Error Correction
            </span>
            <div
              role="group"
              aria-labelledby={errorCorrectionLabelId}
              className="grid grid-cols-4 gap-2 bg-neutral-100 dark:bg-neutral-800/80 p-1 border-2 border-neutral-200 dark:border-neutral-700"
            >
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
                    onClick={() => onErrorCorrectionChange(level)}
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
            onChange={onLogoChange}
            qrColor={qrColor}
            bgColor={bgColor}
            theme={theme}
          />

        </div>

      </div>
    </main>
  );
}
