import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import HistorySidebar from "./HistorySidebar";
import { QrHistoryItem } from "../types";

const history: QrHistoryItem[] = [
  {
    id: "item-1",
    url: "https://freesubqr.vercel.app",
    timestamp: Date.now(),
    qrColor: "#000000",
    bgColor: "#ffffff",
    size: 750,
    errorCorrection: "M",
    logo: null,
    contentType: "url",
  },
  {
    id: "item-2",
    url: "https://github.com",
    timestamp: Date.now() - 60 * 60 * 1000,
    qrColor: "#2563eb",
    bgColor: "#ffffff",
    size: 350,
    errorCorrection: "H",
    logo: null,
    contentType: "url",
  },
];

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  history,
  currentUrl: "https://freesubqr.vercel.app",
  onRestore: vi.fn(),
  onRemove: vi.fn(),
  onClear: vi.fn(),
};

describe("HistorySidebar", () => {
  it("renders the drawer title and every stored code", () => {
    render(<HistorySidebar {...defaultProps} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Recent History")).toBeInTheDocument();
    expect(screen.getByText("https://freesubqr.vercel.app")).toBeInTheDocument();
    expect(screen.getByText("https://github.com")).toBeInTheDocument();
    expect(screen.getByText(/2\/5/)).toBeInTheDocument();
  });

  it("marks the entry matching the current code as active", () => {
    render(<HistorySidebar {...defaultProps} />);

    expect(screen.getByText("Active Code")).toBeInTheDocument();
  });

  it("restores an entry when its card is clicked", () => {
    const onRestore = vi.fn();
    render(<HistorySidebar {...defaultProps} onRestore={onRestore} />);

    fireEvent.click(screen.getByText("https://github.com"));

    expect(onRestore).toHaveBeenCalledTimes(1);
    expect(onRestore.mock.calls[0][0]).toMatchObject({ id: "item-2", size: 350 });
  });

  it("removes a single entry without restoring it", () => {
    const onRemove = vi.fn();
    const onRestore = vi.fn();
    render(<HistorySidebar {...defaultProps} onRemove={onRemove} onRestore={onRestore} />);

    const removeButtons = screen.getAllByTitle("Remove from history");
    fireEvent.click(removeButtons[0]);

    expect(onRemove).toHaveBeenCalledWith("item-1");
    expect(onRestore).not.toHaveBeenCalled();
  });

  it("clears the whole history", () => {
    const onClear = vi.fn();
    render(<HistorySidebar {...defaultProps} onClear={onClear} />);

    fireEvent.click(screen.getByRole("button", { name: /clear history/i }));

    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("closes on the Escape key", () => {
    const onClose = vi.fn();
    render(<HistorySidebar {...defaultProps} onClose={onClose} />);

    fireEvent.keyDown(window, { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows an empty state when there is nothing stored", () => {
    render(<HistorySidebar {...defaultProps} history={[]} currentUrl="" />);

    expect(screen.getByText("No Records Yet")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /clear history/i })).not.toBeInTheDocument();
  });
});
