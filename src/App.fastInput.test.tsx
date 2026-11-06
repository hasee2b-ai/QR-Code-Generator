import { afterEach, describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import App from "./App";
import QRCode from "qrcode";

/**
 * Regression tests for the fast-input render-loop issue.
 *
 * Each keystroke is a synchronous `fireEvent.change` with zero artificial
 * delay between keystrokes, reproducing the original "type a long URL
 * extremely quickly" scenario. `qrcode` is mocked so we can observe the exact
 * payload handed to the encoder and control when each asynchronous
 * generation resolves (needed to prove an in-flight stale result cannot
 * overwrite a newer one).
 */
vi.mock("qrcode", () => ({
  default: {
    toDataURL: vi.fn(),
  },
}));

const toDataURLMock = vi.mocked(QRCode.toDataURL);

// Every encoder call pends until the test releases it, so tests can
// deterministically race an in-flight (stale) generation against a newer one.
const resolvers: Array<() => void> = [];
toDataURLMock.mockImplementation(async (url: string) => {
  await new Promise<void>((resolve) => resolvers.push(resolve));
  return `data:image/png;base64,MOCK_${encodeURIComponent(url)}`;
});

const releaseCall = (index: number) => {
  resolvers[index]?.();
};

const DEFAULT_URL = "https://freesubqr.vercel.app";
const LONG_URL = "https://example.com/" + "a".repeat(222); // exactly 242 chars

const getPreviewSrc = () =>
  screen.getByAltText(/qr code for/i).getAttribute("src");

const releaseLast = () => releaseCall(toDataURLMock.mock.calls.length - 1);

const waitForPreviewContaining = async (substring: string) => {
  await waitFor(
    () => expect(getPreviewSrc()).toContain(substring),
    { timeout: 8000 },
  );
};

const waitForGeneration = async () => {
  await waitFor(() => expect(toDataURLMock.mock.calls.length).toBeGreaterThanOrEqual(1), {
    timeout: 8000,
  });
};

const urlInput = () => screen.getByLabelText("Source Destination URL") as HTMLInputElement;

describe("fast input regression (no artificial typing delays)", () => {
  beforeEach(() => {
    localStorage.clear();
    resolvers.length = 0;
    toDataURLMock.mockClear();
  });

  afterEach(() => {
    // The `qrcode` mock implementation is installed once at module load and must
    // survive across tests in this file, so do not restore all mocks here.
    // Individual spies (e.g. console.error) restore themselves.
  });

  it("never loses characters when a 242-char URL is typed one keystroke at a time", async () => {
    render(<App />);

    // Release the default-URL generation so the app is quiescent.
    await waitForGeneration();
    releaseCall(0);
    await waitForPreviewContaining(encodeURIComponent(DEFAULT_URL));

    const input = urlInput();
    // One fireEvent.change per character, no delay between keystrokes.
    for (let i = 0; i < LONG_URL.length; i++) {
      fireEvent.change(input, { target: { value: LONG_URL.slice(0, i + 1) } });
    }

    // The controlled input must contain every character.
    expect(input.value).toBe(LONG_URL);
    expect(input.value.length).toBe(242);

    // The debounced generation settles on the complete final input.
    await waitFor(() => expect(toDataURLMock.mock.calls.length).toBeGreaterThanOrEqual(2));
    releaseLast();
    await waitForPreviewContaining(encodeURIComponent(LONG_URL));

    const lastPayload = toDataURLMock.mock.calls.at(-1)?.[0];
    expect(lastPayload).toBe(LONG_URL);
    expect(getPreviewSrc()).toContain(encodeURIComponent(LONG_URL));
  }, 180_000);

  it("pastes a long URL in a single change without losing characters", async () => {
    render(<App />);

    await waitForGeneration();
    releaseCall(0);
    await waitForPreviewContaining(encodeURIComponent(DEFAULT_URL));

    const input = urlInput();
    fireEvent.change(input, { target: { value: LONG_URL } });

    expect(input.value).toBe(LONG_URL);
    expect(input.value.length).toBe(242);

    await waitFor(() => expect(toDataURLMock.mock.calls.length).toBeGreaterThanOrEqual(2));
    releaseLast();
    await waitForPreviewContaining(encodeURIComponent(LONG_URL));

    expect(toDataURLMock.mock.calls.at(-1)?.[0]).toBe(LONG_URL);
    expect(getPreviewSrc()).toContain(encodeURIComponent(LONG_URL));
  }, 180_000);

  it("rapid switching between different URLs ends on the last URL", async () => {
    render(<App />);

    await waitForGeneration();
    releaseCall(0);
    await waitForPreviewContaining(encodeURIComponent(DEFAULT_URL));

    const input = urlInput();
    const urlA = "https://alpha.example.com/" + "x".repeat(40);
    const urlB = "https://beta.example.com/" + "y".repeat(40);

    for (let i = 0; i < urlA.length; i++) {
      fireEvent.change(input, { target: { value: urlA.slice(0, i + 1) } });
    }
    await new Promise((r) => setTimeout(r, 150)); // let A's debounced timer fire
    releaseLast();
    await waitForPreviewContaining(encodeURIComponent(urlA));

    for (let i = 0; i < urlB.length; i++) {
      fireEvent.change(input, { target: { value: urlB.slice(0, i + 1) } });
    }
    await new Promise((r) => setTimeout(r, 150)); // let B's debounced timer fire
    releaseLast();
    await waitForPreviewContaining(encodeURIComponent(urlB));

    expect(input.value).toBe(urlB);
    expect(toDataURLMock.mock.calls.at(-1)?.[0]).toBe(urlB);
    expect(getPreviewSrc()).toContain(encodeURIComponent(urlB));
    expect(getPreviewSrc()).not.toContain(encodeURIComponent(urlA));
  });

  it("does not let an outdated in-flight generation overwrite a newer result", async () => {
    render(<App />);

    await waitForGeneration();
    releaseCall(0);
    await waitForPreviewContaining(encodeURIComponent(DEFAULT_URL));

    const input = urlInput();
    const urlA = "https://older.example.com/" + "a".repeat(30);
    const urlB = "https://newer.example.com/" + "b".repeat(30);

    // Start generating A, but hold its resolution so it stays in flight.
    for (let i = 0; i < urlA.length; i++) {
      fireEvent.change(input, { target: { value: urlA.slice(0, i + 1) } });
    }
    await new Promise((r) => setTimeout(r, 150)); // A's timer fires, generation pends

    // Switch to B before A resolves. B's generation must win.
    for (let i = 0; i < urlB.length; i++) {
      fireEvent.change(input, { target: { value: urlB.slice(0, i + 1) } });
    }
    await new Promise((r) => setTimeout(r, 150)); // B's timer fires, generation pends

    const bIndex = toDataURLMock.mock.calls.length - 1; // newest call
    const aIndex = bIndex - 1; // stale call

    // Resolve B first (newer), then A (older/stale — must be discarded).
    releaseCall(bIndex);
    await waitForPreviewContaining(encodeURIComponent(urlB));

    releaseCall(aIndex);
    await new Promise((r) => setTimeout(r, 100)); // let any state updates flush

    expect(input.value).toBe(urlB);
    expect(getPreviewSrc()).toContain(encodeURIComponent(urlB));
    expect(getPreviewSrc()).not.toContain(encodeURIComponent(urlA));
  }, 180_000);

  it("keeps every character when starting from an EMPTY input and typing one keystroke at a time", async () => {
    render(<App />);

    // Release the default-URL generation so the app is quiescent.
    await waitForGeneration();
    releaseCall(0);
    await waitForPreviewContaining(encodeURIComponent(DEFAULT_URL));

    const input = urlInput();
    // Start from a completely empty URL input.
    fireEvent.change(input, { target: { value: "" } });
    expect(input.value).toBe("");

    // Type the 242-char URL one keystroke at a time, no artificial delays.
    for (let i = 0; i < LONG_URL.length; i++) {
      fireEvent.change(input, { target: { value: LONG_URL.slice(0, i + 1) } });
    }

    expect(input.value).toBe(LONG_URL);
    expect(input.value.length).toBe(242);

    // The debounced generation runs exactly once for the complete final URL.
    await waitFor(() => expect(toDataURLMock.mock.calls.length).toBeGreaterThanOrEqual(2));
    releaseLast();
    await waitForPreviewContaining(encodeURIComponent(LONG_URL));

    expect(toDataURLMock.mock.calls.at(-1)?.[0]).toBe(LONG_URL);
  }, 180_000);

  it("survives rapidly replacing the complete URL with other complete URLs", async () => {
    render(<App />);

    await waitForGeneration();
    releaseCall(0);
    await waitForPreviewContaining(encodeURIComponent(DEFAULT_URL));

    const input = urlInput();
    const urlA = "https://alpha.example.com/" + "x".repeat(40);
    const urlB = "https://beta.example.com/" + "y".repeat(40);
    const urlC = "https://gamma.example.com/" + "z".repeat(40);

    // Establish a first complete URL and let its generation land.
    fireEvent.change(input, { target: { value: urlA } });
    await new Promise((r) => setTimeout(r, 150));
    releaseLast();
    await waitForPreviewContaining(encodeURIComponent(urlA));

    // Now replace the WHOLE value, back-to-back, with B then C. Each change
    // resets the debounce, so only the final value may reach the encoder.
    fireEvent.change(input, { target: { value: urlB } });
    fireEvent.change(input, { target: { value: urlC } });
    expect(input.value).toBe(urlC);

    await new Promise((r) => setTimeout(r, 150)); // let C's debounced timer fire
    releaseLast();
    await waitForPreviewContaining(encodeURIComponent(urlC));

    expect(input.value).toBe(urlC);
    expect(toDataURLMock.mock.calls.at(-1)?.[0]).toBe(urlC);
    expect(getPreviewSrc()).not.toContain(encodeURIComponent(urlB));
    expect(getPreviewSrc()).not.toContain(encodeURIComponent(urlA));
  }, 180_000);

  it("preserves values when switching rapidly between URL and Text content types", async () => {
    render(<App />);

    await waitForGeneration();
    releaseCall(0);
    await waitForPreviewContaining(encodeURIComponent(DEFAULT_URL));

    const urlT = "https://switch.example.com/" + "s".repeat(20);
    const typedText = "Rapid switch payload";

    // Type a URL keystroke by keystroke and let its generation land.
    const input = urlInput();
    for (let i = 0; i < urlT.length; i++) {
      fireEvent.change(input, { target: { value: urlT.slice(0, i + 1) } });
    }
    await new Promise((r) => setTimeout(r, 150));
    releaseLast();
    await waitForPreviewContaining(encodeURIComponent(urlT));

    // Switch to Text and type char-by-char (no delays).
    fireEvent.click(screen.getByRole("button", { name: /text content type/i }));
    const textArea = await screen.findByLabelText("Text Content");
    for (let i = 0; i < typedText.length; i++) {
      fireEvent.change(textArea, { target: { value: typedText.slice(0, i + 1) } });
    }
    await new Promise((r) => setTimeout(r, 150));
    releaseLast();
    await waitForPreviewContaining(encodeURIComponent(typedText));
    expect(toDataURLMock.mock.calls.at(-1)?.[0]).toBe(typedText);

    // Switch back to Link: the typed URL must be exactly as we left it, and
    // the newly generated payload must be that URL again.
    fireEvent.click(screen.getByRole("button", { name: /url content type/i }));
    const inputBack = (await screen.findByLabelText("Source Destination URL")) as HTMLInputElement;
    expect(inputBack.value).toBe(urlT);

    await new Promise((r) => setTimeout(r, 150)); // debounced URL regeneration
    releaseLast();
    await waitForPreviewContaining(encodeURIComponent(urlT));
    expect(toDataURLMock.mock.calls.at(-1)?.[0]).toBe(urlT);
  }, 180_000);

  it("does not exceed maximum update depth when typing a long URL extremely fast", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(<App />);

    await waitForGeneration();
    releaseCall(0);
    await waitForPreviewContaining(encodeURIComponent(DEFAULT_URL));

    const input = urlInput();
    for (let i = 0; i < LONG_URL.length; i++) {
      fireEvent.change(input, { target: { value: LONG_URL.slice(0, i + 1) } });
    }

    await new Promise((r) => setTimeout(r, 200)); // let the final debounce fire
    releaseLast();
    await waitForPreviewContaining(encodeURIComponent(LONG_URL));

    expect(input.value).toBe(LONG_URL);

    const updateDepthWarnings = errorSpy.mock.calls.some(
      ([msg]) =>
        typeof msg === "string" &&
        /maximum update depth|update depth exceeded|Too many re-renders/.test(msg),
    );
    expect(updateDepthWarnings).toBe(false);

    errorSpy.mockRestore();
  }, 180_000);
});
