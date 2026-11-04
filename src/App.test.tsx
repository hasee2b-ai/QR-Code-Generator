import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import App from "./App";
import { QrHistoryItem } from "./types";

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

  it("never saves a generated Wi-Fi code to history", async () => {
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
    // the matrix has been compiled) so the history path really executed.
    await screen.findByAltText(/qr code for HomeNetwork/i, {}, { timeout: 4000 });

    const stored = localStorage.getItem("hk_qr_history") ?? "";
    expect(stored).toBe(JSON.stringify([urlHistoryEntry]));
    expect(stored).not.toContain("hunter2-secret");
    expect(stored).not.toContain("WIFI:");

    // In-memory history also unchanged: still just the one seeded entry.
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
