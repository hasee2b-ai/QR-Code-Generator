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
    expect(screen.getByRole("link", { name: /how it works/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("link", { name: /how it works/i }));
    expect(menuButton).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(menuButton);
    expect(menuButton).toHaveAttribute("aria-expanded", "true");
    fireEvent.keyDown(window, { key: "Escape" });
    expect(menuButton).toHaveAttribute("aria-expanded", "false");
  });
});
