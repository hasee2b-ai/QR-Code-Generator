import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import App from "./App";

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
});
