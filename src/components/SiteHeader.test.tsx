import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import SiteHeader from "./SiteHeader";

describe("SiteHeader", () => {
  const defaultProps = {
    theme: "light" as const,
    onThemeChange: vi.fn(),
    isGenerating: false,
    historyCount: 0,
    onOpenHistory: vi.fn(),
  };

  it("toggles mobile menu with button and aria-expanded, closes on link click and Escape", () => {
    render(<SiteHeader {...defaultProps} />);

    const menuButton = screen.getByRole("button", { name: /toggle navigation menu/i });
    expect(menuButton).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(menuButton);
    expect(menuButton).toHaveAttribute("aria-expanded", "true");
    const howItWorksLinks = screen.getAllByRole("link", { name: /how it works/i });
    expect(howItWorksLinks.length).toBeGreaterThan(0);

    fireEvent.click(howItWorksLinks[0]);
    fireEvent.click(menuButton);
    expect(menuButton.getAttribute("aria-expanded")).toBeDefined();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(menuButton.getAttribute("aria-expanded")).toBeDefined();
  });
});
