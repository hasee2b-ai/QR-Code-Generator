import { useState, useRef, type DragEvent, type ChangeEvent } from "react";
import {
  UploadCloud,
  X,
  Sparkles,
  Check,
  Shapes,
  Maximize2,
  ShieldCheck,
  Palette
} from "lucide-react";
import { LogoConfig, LogoShape } from "../types";
import {
  PRESET_LOGOS,
  createPresetSvgDataUri,
  resolvePresetIconColor,
} from "../utils/presetLogos";

interface LogoSelectorProps {
  logo: LogoConfig | null;
  onChange: (logo: LogoConfig | null) => void;
  qrColor: string;
  bgColor: string;
  theme?: "light" | "dark";
}

export default function LogoSelector({
  logo,
  onChange,
  qrColor,
  bgColor,
}: LogoSelectorProps) {
  const [activeTab, setActiveTab] = useState<"presets" | "upload">(
    logo?.type === "upload" ? "upload" : "presets"
  );
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active preset lookup
  const currentPreset = PRESET_LOGOS.find((p) => p.id === logo?.presetId);
  const activeBadgeBg = logo?.bgColor || bgColor || "#ffffff";
  const activeIconPref = logo?.iconColor || "auto";
  const resolvedCurrentColor = resolvePresetIconColor(
    activeBadgeBg,
    activeIconPref,
    qrColor
  );

  // Handle Preset Selection
  const handleSelectPreset = (presetId: string) => {
    const preset = PRESET_LOGOS.find((p) => p.id === presetId);
    if (!preset) return;

    const badgeBg = logo?.bgColor || bgColor || "#ffffff";
    const iconPref = logo?.iconColor || "auto";
    const resolvedColor = resolvePresetIconColor(badgeBg, iconPref, qrColor);
    const iconDataUri = createPresetSvgDataUri(preset, resolvedColor);

    onChange({
      enabled: true,
      type: "preset",
      presetId: preset.id,
      name: preset.name,
      src: iconDataUri,
      sizeRatio: logo?.sizeRatio ?? 0.22,
      shape: logo?.shape ?? "rounded",
      paddingRatio: 0.18,
      bgColor: badgeBg,
      iconColor: iconPref,
    });
  };

  // Process and load an image file into Base64 Data URL
  const processImageFile = (file: File) => {
    setUploadError(null);

    // Validate type
    const validTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/svg+xml",
      "image/webp",
    ];
    if (!validTypes.includes(file.type)) {
      setUploadError("Please provide a valid image file (PNG, JPG, SVG, or WebP).");
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image is too large. Maximum file size is 5 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        onChange({
          enabled: true,
          type: "upload",
          name: file.name,
          src: result,
          sizeRatio: logo?.sizeRatio ?? 0.22,
          shape: logo?.shape ?? "rounded",
          paddingRatio: 0.15,
          bgColor: logo?.bgColor ?? bgColor,
        });
      }
    };
    reader.onerror = () => {
      setUploadError("Failed to read image file. Please try another.");
    };
    reader.readAsDataURL(file);
  };

  // Drag & Drop handlers
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processImageFile(file);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      processImageFile(file);
    }
  };

  // Change Shape
  const handleShapeChange = (shape: LogoShape) => {
    if (!logo) return;
    onChange({
      ...logo,
      shape,
    });
  };

  // Change Size
  const handleSizeChange = (sizeRatio: number) => {
    if (!logo) return;
    onChange({
      ...logo,
      sizeRatio,
    });
  };

  // Change Badge Background
  const handleBgChange = (newBg: string) => {
    if (!logo) return;
    let newSrc = logo.src;
    if (logo.type === "preset" && logo.presetId) {
      const preset = PRESET_LOGOS.find((p) => p.id === logo.presetId);
      if (preset) {
        const resolvedColor = resolvePresetIconColor(
          newBg,
          logo.iconColor,
          qrColor
        );
        newSrc = createPresetSvgDataUri(preset, resolvedColor);
      }
    }
    onChange({
      ...logo,
      bgColor: newBg,
      src: newSrc,
    });
  };

  // Change Preset Icon Color
  const handleIconColorChange = (newColorPref: string) => {
    if (!logo || logo.type !== "preset" || !logo.presetId) return;
    const preset = PRESET_LOGOS.find((p) => p.id === logo.presetId);
    if (!preset) return;

    const badgeBg = logo.bgColor || bgColor || "#ffffff";
    const resolvedColor = resolvePresetIconColor(badgeBg, newColorPref, qrColor);
    const newSrc = createPresetSvgDataUri(preset, resolvedColor);

    onChange({
      ...logo,
      iconColor: newColorPref,
      src: newSrc,
    });
  };

  // Remove logo completely
  const handleClearLogo = () => {
    onChange(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4 pt-4 border-t border-neutral-900/10 dark:border-neutral-800">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="block text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">
            Center Badge / Icon
          </label>
          {logo?.enabled && (
            <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
              Active
            </span>
          )}
        </div>

        {logo?.enabled && (
          <button
            type="button"
            onClick={handleClearLogo}
            className="text-[10px] font-bold text-neutral-400 hover:text-neutral-900 dark:text-neutral-500 dark:hover:text-white transition-colors uppercase tracking-widest flex items-center gap-1 cursor-pointer"
          >
            <X className="w-3 h-3" />
            Remove Logo
          </button>
        )}
      </div>

      {/* Tabs for Presets vs Upload */}
      <div className="flex border-2 border-neutral-900 dark:border-neutral-200 p-0.5 bg-neutral-100 dark:bg-neutral-950">
        <button
          type="button"
          onClick={() => setActiveTab("presets")}
          className={`flex-1 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === "presets"
              ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]"
              : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Preset Icons
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("upload")}
          className={`flex-1 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === "upload"
              ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]"
              : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
          }`}
        >
          <UploadCloud className="w-3.5 h-3.5" />
          Upload File
        </button>
      </div>

      {/* Tab Content: Presets */}
      {activeTab === "presets" && (
        <div className="space-y-3">
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {PRESET_LOGOS.map((preset) => {
              const isSelected =
                logo?.type === "preset" && logo?.presetId === preset.id;

              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset.id)}
                  title={preset.name}
                  className={`relative p-2.5 flex flex-col items-center justify-center border-2 transition-all cursor-pointer group rounded-none select-none ${
                    isSelected
                      ? "bg-neutral-900 dark:bg-white border-neutral-900 dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]"
                      : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-neutral-900 dark:hover:border-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/80"
                  }`}
                >
                  <svg
                    viewBox={preset.viewBox}
                    className={`w-5 h-5 transition-colors ${
                      isSelected
                        ? "text-white dark:text-neutral-900"
                        : "text-neutral-700 dark:text-neutral-200 group-hover:text-neutral-950 dark:group-hover:text-white"
                    }`}
                    fill={preset.type === "fill" ? "currentColor" : "none"}
                    stroke={preset.type === "stroke" ? "currentColor" : "none"}
                    strokeWidth={preset.type === "stroke" ? "2.2" : undefined}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    dangerouslySetInnerHTML={{ __html: preset.elements }}
                  />
                  <span
                    className={`text-[8px] font-mono font-bold mt-1.5 tracking-tight truncate max-w-full ${
                      isSelected
                        ? "text-white dark:text-neutral-900"
                        : "text-neutral-600 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white"
                    }`}
                  >
                    {preset.name}
                  </span>
                  {isSelected && (
                    <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white border border-neutral-900 dark:border-white flex items-center justify-center text-[9px] shadow-sm">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Active Preset Summary Banner */}
          {logo?.type === "preset" && logo.enabled && currentPreset && (
            <div className="flex items-center justify-between p-2.5 border-2 border-neutral-900 dark:border-neutral-200 bg-white dark:bg-neutral-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.08)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.12)]">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 border-2 border-neutral-900 dark:border-neutral-300 p-2 flex items-center justify-center transition-colors"
                  style={{
                    backgroundColor: activeBadgeBg,
                  }}
                >
                  <svg
                    viewBox={currentPreset.viewBox}
                    className="w-5 h-5 transition-colors"
                    fill={currentPreset.type === "fill" ? resolvedCurrentColor : "none"}
                    stroke={currentPreset.type === "stroke" ? resolvedCurrentColor : "none"}
                    strokeWidth={currentPreset.type === "stroke" ? "2.2" : undefined}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    dangerouslySetInnerHTML={{ __html: currentPreset.elements }}
                  />
                </div>
                <div>
                  <div className="text-[11px] font-bold font-mono text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <span>{currentPreset.name}</span>
                    <span className="text-[9px] font-normal px-1.5 py-0.2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-700">
                      Active
                    </span>
                  </div>
                  <div className="text-[9px] font-mono text-neutral-500 dark:text-neutral-400">
                    Vector badge centered in matrix
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClearLogo}
                className="p-1.5 text-neutral-400 hover:text-neutral-900 dark:text-neutral-500 dark:hover:text-white transition-colors cursor-pointer"
                title="Remove preset logo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Upload */}
      {activeTab === "upload" && (
        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
            onChange={handleFileInputChange}
            className="hidden"
            id="qr-logo-file-input"
            aria-label="Upload logo image"
          />

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
              isDragging
                ? "border-neutral-900 dark:border-white bg-neutral-100 dark:bg-neutral-800"
                : "border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-neutral-900 dark:hover:border-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/60"
            }`}
          >
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-10 h-10 border-2 border-neutral-900 dark:border-neutral-200 flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.7)]">
                <UploadCloud className="w-5 h-5 text-neutral-900 dark:text-white" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                  Drag & Drop Logo or Click to Browse
                </p>
                <p className="text-[9px] font-mono text-neutral-400 dark:text-neutral-500 mt-0.5">
                  Supports PNG, JPG, SVG, WebP (Max 5 MB)
                </p>
              </div>
            </div>
          </div>

          {uploadError && (
            <div className="text-[10px] font-mono text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 p-2 border border-red-200 dark:border-red-800">
              {uploadError}
            </div>
          )}

          {/* Active Upload Preview Card */}
          {logo?.type === "upload" && logo.src && (
            <div className="flex items-center justify-between p-2.5 border-2 border-neutral-900 dark:border-neutral-200 bg-neutral-50 dark:bg-neutral-950">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-1 flex items-center justify-center">
                  <img
                    src={logo.src}
                    alt="Uploaded Logo"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div>
                  <div className="text-[11px] font-bold font-mono text-neutral-900 dark:text-white truncate max-w-[200px]">
                    {logo.name || "Custom Logo"}
                  </div>
                  <div className="text-[9px] font-mono text-neutral-400 dark:text-neutral-500">
                    Uploaded Image Active
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClearLogo}
                className="p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                title="Remove uploaded logo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* When a logo is actively configured, display shape, size & color controls */}
      {logo?.enabled && (
        <div className="space-y-3 pt-2 bg-neutral-50 dark:bg-neutral-950/60 p-3 border border-neutral-200 dark:border-neutral-800">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Shape Selector */}
            <div>
              <label className="block text-[9px] font-mono font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                <Shapes className="w-3 h-3" /> Badge Shape
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    { id: "rounded", label: "Rounded" },
                    { id: "circle", label: "Circle" },
                    { id: "square", label: "Square" },
                  ] as const
                ).map((s) => {
                  const isSelected = (logo.shape || "rounded") === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleShapeChange(s.id)}
                      className={`py-1.5 text-[9px] font-mono font-bold uppercase transition-all border cursor-pointer ${
                        isSelected
                          ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-neutral-900 dark:border-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                          : "bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700 hover:border-neutral-900 dark:hover:border-neutral-300"
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Size Ratio Selector */}
            <div>
              <label className="block text-[9px] font-mono font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                <Maximize2 className="w-3 h-3" /> Badge Size
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { ratio: 0.18, label: "Compact", pct: "18%" },
                  { ratio: 0.22, label: "Default", pct: "22%" },
                  { ratio: 0.26, label: "Prominent", pct: "26%" },
                ].map((s) => {
                  const isSelected = Math.abs((logo.sizeRatio || 0.22) - s.ratio) < 0.01;
                  return (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => handleSizeChange(s.ratio)}
                      className={`py-1.5 text-[9px] font-mono font-bold uppercase transition-all border cursor-pointer ${
                        isSelected
                          ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-neutral-900 dark:border-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                          : "bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700 hover:border-neutral-900 dark:hover:border-neutral-300"
                      }`}
                    >
                      {s.label} <span className="opacity-70">({s.pct})</span>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Preset Icon Color Palette (only for vector presets) */}
          {logo.type === "preset" && (
            <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[9px] font-mono font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest flex items-center gap-1">
                <Palette className="w-3 h-3" /> Icon Tone
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleIconColorChange("auto")}
                  className={`px-2 py-0.5 text-[9px] font-mono font-bold uppercase border cursor-pointer ${
                    !logo.iconColor || logo.iconColor === "auto"
                      ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-neutral-900 dark:border-white"
                      : "bg-white dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700"
                  }`}
                  title="Matches QR matrix color with guaranteed contrast"
                >
                  Match Matrix
                </button>
                <button
                  type="button"
                  onClick={() => handleIconColorChange("#000000")}
                  className={`px-2 py-0.5 text-[9px] font-mono font-bold uppercase border cursor-pointer ${
                    logo.iconColor === "#000000"
                      ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-neutral-900 dark:border-white"
                      : "bg-white dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700"
                  }`}
                >
                  Dark
                </button>
                <button
                  type="button"
                  onClick={() => handleIconColorChange("#ffffff")}
                  className={`px-2 py-0.5 text-[9px] font-mono font-bold uppercase border cursor-pointer ${
                    logo.iconColor === "#ffffff"
                      ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-neutral-900 dark:border-white"
                      : "bg-white dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700"
                  }`}
                >
                  Light
                </button>
              </div>
            </div>
          )}

          {/* Badge Background Color Option */}
          <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[9px] font-mono font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">
              Badge Base Background
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleBgChange(bgColor)}
                className={`px-2 py-0.5 text-[9px] font-mono font-bold uppercase border cursor-pointer ${
                  logo.bgColor === bgColor || !logo.bgColor
                    ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-neutral-900 dark:border-white"
                    : "bg-white dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700"
                }`}
              >
                Match Pattern
              </button>
              <button
                type="button"
                onClick={() => handleBgChange("#ffffff")}
                className={`px-2 py-0.5 text-[9px] font-mono font-bold uppercase border cursor-pointer ${
                  logo.bgColor === "#ffffff" && bgColor !== "#ffffff"
                    ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-neutral-900 dark:border-white"
                    : "bg-white dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700"
                }`}
              >
                White
              </button>
              <button
                type="button"
                onClick={() => handleBgChange("#000000")}
                className={`px-2 py-0.5 text-[9px] font-mono font-bold uppercase border cursor-pointer ${
                  logo.bgColor === "#000000" && bgColor !== "#000000"
                    ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-neutral-900 dark:border-white"
                    : "bg-white dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700"
                }`}
              >
                Dark
              </button>
            </div>
          </div>

          {/* Scannability Safety notice */}
          <div className="flex items-center gap-1.5 text-[9px] font-mono text-emerald-700 dark:text-emerald-400 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Reed-Solomon Level H (30% redundancy) automatically calibrated for instant camera recognition.</span>
          </div>
        </div>
      )}
    </div>
  );
}
