import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { toHaveNoViolations } from "vitest-axe/dist/matchers.js";
import App from "./App";
import { QrHistoryItem } from "./types";

expect.extend({ toHaveNoViolations });

declare module "vitest" {
  interface Assertion<T> {
    toHaveNoViolations(): void;
  }
}

/**
 * jsdom does no layout or real color sampling, so the color-contrast rule
 * cannot compute anything meaningful — it is the only rule disabled here.
 */
const AXE_OPTIONS = {
  rules: {
    "color-contrast": { enabled: false },
  },
};

const expectNoViolations = async (container: HTMLElement) => {
  expect(await axe(container, AXE_OPTIONS)).toHaveNoViolations();
};

const historyEntry: QrHistoryItem = {
  id: "a11y-1",
  url: "https://freesubqr.vercel.app",
  timestamp: Date.now(),
  qrColor: "#000000",
  bgColor: "#ffffff",
  size: 750,
  errorCorrection: "M",
  logo: null,
  contentType: "url",
};

describe("accessibility (axe)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("has zero violations on the initial render", async () => {
    const { container } = render(<App />);
    await expectNoViolations(container);
  });

  it("has zero violations for the text content type", async () => {
    const { container } = render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /^text content type$/i }));
    expect(screen.getByText("Text Content")).toBeInTheDocument();
    await expectNoViolations(container);
  });

  it("has zero violations for the Wi-Fi content type", async () => {
    const { container } = render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /wi-fi content type/i }));
    expect(screen.getByLabelText("Network name (SSID)")).toBeInTheDocument();
    await expectNoViolations(container);
  });

  it("has zero violations with the History drawer open", async () => {
    localStorage.setItem("hk_qr_history", JSON.stringify([historyEntry]));

    const { container } = render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /open recent qr history/i }));

    const drawer = await screen.findByRole("dialog");
    expect(drawer).toHaveTextContent("https://freesubqr.vercel.app");
    await expectNoViolations(container);
  });
});
