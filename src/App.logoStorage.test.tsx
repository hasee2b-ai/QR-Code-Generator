import { afterEach, describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import App from "./App";
import { downscaleLogoForHistory } from "./App";
import { QrHistoryItem } from "./types";

/**
 * Logo image storage tests.
 *
 * `downscaleLogoForHistory` and the canvas/Image APIs are not available in
 * jsdom (no `canvas` package), so `Image` and the canvas 2D context are
 * stubbed below, mirroring the approach in `qrGenerator.test.ts`.
 */

class MockImage {
  static instances: MockImage[] = [];
  static failFor = new Set<string>();
  static sizes = new Map<string, { width: number; height: number }>();

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
    const size = MockImage.sizes.get(value);
    if (size) {
      this.naturalWidth = size.width;
      this.naturalHeight = size.height;
    }
    queueMicrotask(() => {
      if (MockImage.failFor.has(value)) this.onerror?.();
      else this.onload?.();
    });
  }
}

function createCanvasContextStub() {
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

const STUBBED_SMALL = "data:image/png;base64," + "B".repeat(200); // > 100 chars, passes the encoding sanity check
const LARGE_SRC = "data:image/png;base64," + "A".repeat(4_800_000); // ~3.6 MB data URL

let getContextSpy: ReturnType<typeof vi.spyOn>;
let toDataURLSpy: ReturnType<typeof vi.spyOn>;

function setupStubs() {
  localStorage.clear();
  MockImage.instances = [];
  MockImage.failFor = new Set();
  MockImage.sizes = new Map();
  getContextSpy = vi
    .spyOn(HTMLCanvasElement.prototype, "getContext")
    .mockReturnValue(createCanvasContextStub());
  toDataURLSpy = vi
    .spyOn(HTMLCanvasElement.prototype, "toDataURL")
    .mockReturnValue(STUBBED_SMALL);
  vi.stubGlobal("Image", MockImage);
}

function teardownStubs() {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
}

describe("downscaleLogoForHistory", () => {
  beforeEach(setupStubs);
  afterEach(teardownStubs);

  it("downsizes a large uploaded logo to a small data URL for history", async () => {
    MockImage.sizes.set(LARGE_SRC, { width: 2000, height: 2000 });

    const result = await downscaleLogoForHistory(LARGE_SRC);

    expect(result).toBe(STUBBED_SMALL);
    expect(result).not.toBe(LARGE_SRC);
    expect(result.length).toBeLessThan(LARGE_SRC.length);
  });

  it("keeps a small logo unchanged (<= 256 px)", async () => {
    const smallSrc = "data:image/png;base64,SMALL";
    MockImage.sizes.set(smallSrc, { width: 128, height: 128 });

    expect(await downscaleLogoForHistory(smallSrc)).toBe(smallSrc);
  });

  it("returns null when the logo image fails to load", async () => {
    MockImage.failFor.add(LARGE_SRC);
    MockImage.sizes.set(LARGE_SRC, { width: 2000, height: 2000 });

    expect(await downscaleLogoForHistory(LARGE_SRC)).toBeNull();
  });

  it("returns null when the canvas has no 2D context", async () => {
    MockImage.sizes.set(LARGE_SRC, { width: 2000, height: 2000 });
    getContextSpy.mockReturnValue(null);

    expect(await downscaleLogoForHistory(LARGE_SRC)).toBeNull();
  });

  it("returns null when PNG encoding fails", async () => {
    MockImage.sizes.set(LARGE_SRC, { width: 2000, height: 2000 });
    toDataURLSpy.mockReturnValue("");

    expect(await downscaleLogoForHistory(LARGE_SRC)).toBeNull();
  });

  it("never lets a ~3.6 MB original silently enter history storage", async () => {
    MockImage.sizes.set(LARGE_SRC, { width: 2000, height: 2000 });

    const result = await downscaleLogoForHistory(LARGE_SRC);

    expect(result).not.toBe(LARGE_SRC);
    expect(result.length).toBeLessThan(1000);
    expect(LARGE_SRC.length).toBeGreaterThan(3_000_000);
  });
});

describe("history stores an optimized logo while the session keeps the original", () => {
  beforeEach(setupStubs);
  afterEach(teardownStubs);

  it("keeps the live logo intact but stores a downsized copy in history on export", async () => {
    render(<App />);

    // Wait for the default QR to generate.
    const getPreviewSrc = () =>
      screen.getByAltText(/qr code for/i).getAttribute("src");
    await waitFor(() => expect(getPreviewSrc()).toMatch(/^data:image\/png/), { timeout: 8000 });

    // Open the upload tab and upload a "large" logo (reported 2000x2000).
    fireEvent.click(screen.getByRole("button", { name: /upload file/i }));
    const file = new File(["logo-bytes"], "logo.png", { type: "image/png" });
    const input = screen.getByLabelText("Upload logo image") as HTMLInputElement;
    Object.defineProperty(input, "files", { value: [file], configurable: true });
    fireEvent.change(input, { target: { files: [file] } });

    // FileReader is asynchronous in jsdom — wait for the upload card to appear.
    const uploadedImg = await screen.findByAltText("Uploaded Logo");
    expect(uploadedImg).toBeInTheDocument();
    const originalSrc = uploadedImg.getAttribute("src");
    expect(originalSrc).toBeTruthy();

    // Mock the uploaded src as a large image so history downscaling runs.
    MockImage.sizes.set(originalSrc!, { width: 2000, height: 2000 });

    // Export (download) — recordHistory runs and downsizes the logo for storage.
    const download = screen.getByRole("button", { name: /^download$/i });
    fireEvent.click(download);

    await waitFor(() => {
      const stored = localStorage.getItem("hk_qr_history");
      expect(stored).not.toBeNull();
      const entry = JSON.parse(stored!) as QrHistoryItem[];
      return entry.length > 0 && !!entry[0].logo;
    });

    const stored = JSON.parse(localStorage.getItem("hk_qr_history")!) as QrHistoryItem[];
    const historyLogo = stored[0].logo!;
    // The history copy is the downsized stub, never the oversized original.
    // If downscaling had not run, historyLogo.src would equal originalSrc.
    expect(historyLogo.src).toBe(STUBBED_SMALL);
    expect(historyLogo.src).not.toBe(originalSrc);

    // The live session logo still shows the original upload.
    expect(screen.getByAltText("Uploaded Logo").getAttribute("src")).toBe(originalSrc);
    expect(localStorage.getItem("hk_qr_history")).toContain(STUBBED_SMALL);
  });
});
