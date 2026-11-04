import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import QRCode from "qrcode";
import { generateQrCode } from "./qrGenerator";
import { LogoConfig } from "../types";

vi.mock("qrcode", () => ({
  default: { toDataURL: vi.fn() },
}));

const BASE_DATA_URL = "data:image/png;base64,BASE_QR";
const COMPOSITED_DATA_URL = "data:image/png;base64,COMPOSITED_QR";
const LOGO_SRC = "data:image/png;base64,LOGO";

/**
 * Minimal Image double: handlers are fired in a microtask once `src` is set,
 * mirroring the async decode of a real image without any decoding at all.
 * Sources listed in `failFor` trigger `onerror` instead of `onload`.
 */
class MockImage {
  static instances: MockImage[] = [];
  static failFor = new Set<string>();

  crossOrigin = "";
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  naturalWidth = 128;
  naturalHeight = 128;
  #src = "";

  constructor() {
    MockImage.instances.push(this);
  }

  get src() {
    return this.#src;
  }

  set src(value: string) {
    this.#src = value;
    const failed = MockImage.failFor.has(value);
    queueMicrotask(() => {
      if (failed) this.onerror?.();
      else this.onload?.();
    });
  }
}

/** Canvas 2D double covering every call generateQrCode makes. */
function createCanvasContextStub(): CanvasRenderingContext2D {
  return {
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    drawImage: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    clip: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    roundRect: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
}

const activeLogo: LogoConfig = {
  enabled: true,
  src: LOGO_SRC,
  type: "upload",
  name: "test-logo",
  sizeRatio: 0.22,
  shape: "rounded",
  paddingRatio: 0.18,
};

const baseOptions = {
  url: "https://freesubqr.vercel.app",
  size: 750,
  qrColor: "#000000",
  bgColor: "#ffffff",
  errorCorrection: "Q" as const,
};

// qrcode's `toDataURL` is overloaded (callback + promise forms); pin the mock
// to the promise signature generateQrCode uses.
const toDataURLMock = QRCode.toDataURL as unknown as Mock<
  (url: string, options?: unknown) => Promise<string>
>;

describe("generateQrCode", () => {
  beforeEach(() => {
    MockImage.instances = [];
    MockImage.failFor = new Set();
    toDataURLMock.mockReset();
    toDataURLMock.mockResolvedValue(BASE_DATA_URL);
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      createCanvasContextStub()
    );
    vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue(
      COMPOSITED_DATA_URL
    );
    vi.stubGlobal("Image", MockImage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns the base data URL with the requested error correction when no logo is set", async () => {
    const result = await generateQrCode({ ...baseOptions, logo: null });

    expect(result).toBe(BASE_DATA_URL);
    expect(toDataURLMock).toHaveBeenCalledTimes(1);
    expect(toDataURLMock).toHaveBeenCalledWith(
      baseOptions.url,
      expect.objectContaining({
        width: baseOptions.size,
        errorCorrectionLevel: "Q",
        color: { dark: "#000000", light: "#ffffff" },
      })
    );
    // No canvas pass happens without a logo.
    expect(MockImage.instances).toHaveLength(0);
  });

  it("does not force level H for a disabled or source-less logo", async () => {
    const result = await generateQrCode({
      ...baseOptions,
      logo: { ...activeLogo, enabled: false },
    });

    expect(result).toBe(BASE_DATA_URL);
    expect(toDataURLMock).toHaveBeenCalledWith(
      baseOptions.url,
      expect.objectContaining({ errorCorrectionLevel: "Q" })
    );
  });

  it("forces error correction level H when a logo is active", async () => {
    const result = await generateQrCode({ ...baseOptions, logo: activeLogo });

    expect(toDataURLMock).toHaveBeenCalledWith(
      baseOptions.url,
      expect.objectContaining({ errorCorrectionLevel: "H" })
    );
    // The badge is composited over the matrix on the canvas.
    expect(result).toBe(COMPOSITED_DATA_URL);
  });

  it("falls back to the base QR when the logo image fails to load", async () => {
    MockImage.failFor.add(LOGO_SRC);

    const result = await generateQrCode({ ...baseOptions, logo: activeLogo });

    expect(result).toBe(BASE_DATA_URL);
  });

  it("falls back to the base QR when the QR image itself fails to load", async () => {
    MockImage.failFor.add(BASE_DATA_URL);

    const result = await generateQrCode({ ...baseOptions, logo: activeLogo });

    expect(result).toBe(BASE_DATA_URL);
  });

  it("falls back to the base QR when the canvas has no 2D context", async () => {
    vi.mocked(HTMLCanvasElement.prototype.getContext).mockReturnValue(null);

    const result = await generateQrCode({ ...baseOptions, logo: activeLogo });

    expect(result).toBe(BASE_DATA_URL);
  });
});
