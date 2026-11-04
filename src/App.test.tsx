import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { readFileSync } from "node:fs";
import path from "node:path";
import App from "./App";
import { QrHistoryItem } from "./types";

const pkg = JSON.parse(readFileSync(path.resolve(process.cwd(), "package.json"), "utf8")) as {
  version: string;
};

const urlHistoryEntry: QrHistoryItem = {
  id: "u1",
  url: "https://github.com",
  timestamp: Date.now(),
  qrColor: "#000000",
  bgColor: "#ffffff",
  size: 750,
  errorCorrection: "M",
  logo: null,
  contentType: "url",
};

/** Source of the previewed QR image (only present once generation succeeded). */
const getPreviewSrc = () => screen.getByAltText(/qr code for/i).getAttribute("src");

/** Waits until the preview shows a freshly generated matrix. */
const waitForFreshPreview = async (previousSrc: string | null) => {
  await waitFor(() => expect(getPreviewSrc()).toMatch(/^data:image\/png/), { timeout: 4000 });
  if (previousSrc !== null) {
    await waitFor(() => expect(getPreviewSrc()).not.toBe(previousSrc), { timeout: 4000 });
  }
};

describe("App", () => {
  it("renders the generator workspace and the export actions", () => {
    render(<App />);

    // The heading is split across a <br/> so match with optional whitespace.
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/free qr code\s*generator/i);
    expect(screen.getByLabelText("QR code generator")).toBeInTheDocument();
    expect(screen.getByText("Source Destination URL")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^download$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^svg$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^copy$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^share$/i })).toBeInTheDocument();

    // The header badge shows the real package version, injected via `define`.
    expect(
      screen.getByText(new RegExp(`^v${pkg.version.replace(/\./g, "\\.")} // STABLE$`))
    ).toBeInTheDocument();
    expect(screen.getByText("License: Apache-2.0")).toBeInTheDocument();
  });

  it("starts with the production URL and an empty history", async () => {
    localStorage.clear();
    render(<App />);

    const urlInput = screen.getByLabelText("Source Destination URL") as HTMLInputElement;
    expect(urlInput.value).toBe("https://freesubqr.vercel.app");

    // No history exists until the first successful export.
    await waitForFreshPreview(null);
    expect(localStorage.getItem("hk_qr_history")).toBeNull();
    expect(screen.getByRole("button", { name: /open recent qr history/i })).toHaveTextContent(
      /^History0$/
    );
  });

  it("switches between the url, text and wifi content types", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /^text content type$/i }));
    expect(screen.getByText("Text Content")).toBeInTheDocument();
    expect(screen.queryByText("Source Destination URL")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /wi-fi content type/i }));
    expect(screen.getByLabelText("Network name (SSID)")).toBeInTheDocument();
    expect(screen.getByLabelText("Network password")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^url content type$/i }));
    expect(screen.getByText("Source Destination URL")).toBeInTheDocument();
  });

  it("keeps the SEO content sections on the page", () => {
    render(<App />);

    expect(screen.getByRole("heading", { level: 2, name: /everything a qr code maker should be/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: /how to make a qr code/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: /qr code generator faq/i })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem").length).toBeGreaterThanOrEqual(9);
  });

  it("records history only after a successful export, de-duplicating URLs by value", async () => {
    localStorage.clear();
    render(<App />);

    await waitForFreshPreview(null);

    // Generating alone writes nothing.
    expect(localStorage.getItem("hk_qr_history")).toBeNull();

    const download = screen.getByRole("button", { name: /^download$/i });
    fireEvent.click(download);

    const first = JSON.parse(localStorage.getItem("hk_qr_history") ?? "[]");
    expect(first).toHaveLength(1);
    expect(first[0].url).toBe("https://freesubqr.vercel.app");
    expect(first[0].contentType).toBe("url");

    // Re-exporting the same destination de-duplicates case-insensitively:
    // only the newest payload survives, and no second entry appears.
    const previousSrc = getPreviewSrc();
    fireEvent.change(screen.getByLabelText("Source Destination URL"), {
      target: { value: "HTTPS://FREESUBQR.VERCEL.APP" },
    });
    await waitForFreshPreview(previousSrc);

    fireEvent.click(download);

    const second = JSON.parse(localStorage.getItem("hk_qr_history") ?? "[]");
    expect(second).toHaveLength(1);
    expect(second[0].url).toBe("HTTPS://FREESUBQR.VERCEL.APP");
  });

  it("de-duplicates text case-sensitively", async () => {
    localStorage.clear();
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /^text content type$/i }));
    const textarea = screen.getByLabelText("Text Content");
    fireEvent.change(textarea, { target: { value: "Meeting at 7" } });

    await waitForFreshPreview(null);
    fireEvent.click(screen.getByRole("button", { name: /^download$/i }));
    expect(JSON.parse(localStorage.getItem("hk_qr_history") ?? "[]")).toHaveLength(1);

    // Same text in a different case is a different payload for the text type.
    const previousSrc = getPreviewSrc();
    fireEvent.change(textarea, { target: { value: "meeting at 7" } });
    await waitForFreshPreview(previousSrc);
    fireEvent.click(screen.getByRole("button", { name: /^download$/i }));

    const stored = JSON.parse(localStorage.getItem("hk_qr_history") ?? "[]");
    expect(stored).toHaveLength(2);
    expect(stored.map((entry: QrHistoryItem) => entry.url)).toEqual([
      "meeting at 7",
      "Meeting at 7",
    ]);
  });

  it("never saves a generated Wi-Fi code to history, even when exported", async () => {
    localStorage.clear();
    localStorage.setItem("hk_qr_history", JSON.stringify([urlHistoryEntry]));

    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /wi-fi content type/i }));
    fireEvent.change(screen.getByLabelText("Network name (SSID)"), {
      target: { value: "HomeNetwork" },
    });
    fireEvent.change(screen.getByLabelText("Network password"), {
      target: { value: "hunter2-secret" },
    });

    // Wait for a successful generation (the preview image only appears once
    // the matrix has been compiled) so the export path really executes.
    await waitFor(() => expect(getPreviewSrc()).toMatch(/^data:image\/png/), { timeout: 4000 });

    // Export attempts must not persist the Wi-Fi payload either.
    fireEvent.click(screen.getByRole("button", { name: /^download$/i }));

    const stored = localStorage.getItem("hk_qr_history") ?? "";
    expect(stored).toBe(JSON.stringify([urlHistoryEntry]));
    expect(stored).not.toContain("hunter2-secret");
    expect(stored).not.toContain("WIFI:");

    // In-memory history also unchanged: still just the one stored entry.
    expect(screen.getByRole("button", { name: /open recent qr history/i })).toHaveTextContent(
      /^History1$/
    );
  });

  it("drops stored Wi-Fi entries (and their passwords) when history is loaded", () => {
    localStorage.clear();

    const wifiTypedEntry: QrHistoryItem = {
      id: "w1",
      url: "WIFI:T:WPA;S:HomeNetwork;P:hunter2;;",
      timestamp: Date.now(),
      qrColor: "#000000",
      bgColor: "#ffffff",
      size: 750,
      errorCorrection: "M",
      logo: null,
      contentType: "wifi",
      wifi: { ssid: "HomeNetwork", password: "hunter2", security: "WPA", hidden: false },
    };
    // Legacy entry: raw WIFI: payload but no contentType field.
    const legacyWifiEntry = {
      id: "w2",
      url: "WIFI:T:nopass;S:CafeGuest;;",
      timestamp: Date.now(),
      qrColor: "#000000",
      bgColor: "#ffffff",
      size: 350,
      errorCorrection: "L",
      logo: null,
    };
    localStorage.setItem(
      "hk_qr_history",
      JSON.stringify([wifiTypedEntry, legacyWifiEntry, urlHistoryEntry])
    );

    render(<App />);

    const raw = localStorage.getItem("hk_qr_history") ?? "";
    expect(raw).not.toContain("hunter2");
    expect(raw).not.toContain("WIFI:");

    const cleaned = JSON.parse(raw) as QrHistoryItem[];
    expect(cleaned).toHaveLength(1);
    expect(cleaned[0].id).toBe("u1");

    // The drawer reflects the cleaned list as well.
    fireEvent.click(screen.getByRole("button", { name: /open recent qr history/i }));
    expect(screen.getByText("https://github.com")).toBeInTheDocument();
    expect(screen.queryByText(/WIFI:/)).not.toBeInTheDocument();
  });

  it("says the password is included when a Wi-Fi share falls back to the clipboard", async () => {
    localStorage.clear();
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /wi-fi content type/i }));
    fireEvent.change(screen.getByLabelText("Network name (SSID)"), {
      target: { value: "HomeNetwork" },
    });
    fireEvent.change(screen.getByLabelText("Network password"), {
      target: { value: "hunter2" },
    });
    await waitForFreshPreview(null);

    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    // jsdom has no Web Share API, so this takes the clipboard fallback path.
    fireEvent.click(screen.getByRole("button", { name: /^share$/i }));

    await waitFor(() => {
      expect(
        screen.getAllByText(/includes your network password/i).length
      ).toBeGreaterThan(0);
    });
    // The copied payload is the Wi-Fi join string, password included.
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("WIFI:"));
  });

  it("still renders when Storage reads and writes throw", () => {
    const getItemSpy = vi
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation(() => {
        throw new Error("storage blocked");
      });
    const setItemSpy = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("storage blocked");
      });

    try {
      render(<App />);

      expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
      expect(screen.getByText("Source Destination URL")).toBeInTheDocument();

      // A write path (theme persistence) must not blow up either.
      fireEvent.click(screen.getByRole("button", { name: /^dark$/i }));
      expect(document.documentElement.classList.contains("dark")).toBe(true);

      // The stubs must have actually been hit by the app under test.
      expect(getItemSpy).toHaveBeenCalled();
      expect(setItemSpy).toHaveBeenCalled();
    } finally {
      getItemSpy.mockRestore();
      setItemSpy.mockRestore();
    }
  });
});
