import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import LogoSelector from "./LogoSelector";
import { PRESET_LOGOS } from "../utils/presetLogos";
import { LogoConfig } from "../types";

const defaultProps = {
  logo: null,
  onChange: vi.fn(),
  qrColor: "#000000",
  bgColor: "#ffffff",
  theme: "light" as const,
};

const uploadedLogo: LogoConfig = {
  enabled: true,
  src: "data:image/png;base64,AAAA",
  type: "upload",
  name: "logo.png",
  sizeRatio: 0.22,
  shape: "rounded",
  paddingRatio: 0.15,
};

describe("LogoSelector", () => {
  it("renders every preset icon", () => {
    render(<LogoSelector {...defaultProps} />);

    expect(screen.getByRole("button", { name: /preset icons/i })).toBeInTheDocument();
    for (const preset of PRESET_LOGOS) {
      expect(screen.getByTitle(preset.name)).toBeInTheDocument();
    }
  });

  it("emits a preset logo config when an icon is picked", () => {
    const onChange = vi.fn();
    render(<LogoSelector {...defaultProps} onChange={onChange} />);

    fireEvent.click(screen.getByTitle("Globe"));

    expect(onChange).toHaveBeenCalledTimes(1);
    const emitted = onChange.mock.calls[0][0] as LogoConfig;
    expect(emitted.enabled).toBe(true);
    expect(emitted.type).toBe("preset");
    expect(emitted.presetId).toBe("globe");
    expect(emitted.src.startsWith("data:image/svg+xml")).toBe(true);
  });

  it("switches to the upload tab and shows the dropzone", () => {
    render(<LogoSelector {...defaultProps} />);

    fireEvent.click(screen.getByRole("button", { name: /upload file/i }));

    expect(screen.getByText(/drag & drop logo or click to browse/i)).toBeInTheDocument();
    expect(screen.getByText(/supports png, jpg, svg, webp/i)).toBeInTheDocument();
  });

  it("shows badge controls and a remove action when a logo is active", () => {
    render(<LogoSelector {...defaultProps} logo={uploadedLogo} />);

    expect(screen.getByText("Badge Shape")).toBeInTheDocument();
    expect(screen.getByText("Badge Size")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /remove logo/i })).toBeInTheDocument();
  });

  it("clears the logo when the remove action is clicked", () => {
    const onChange = vi.fn();
    render(<LogoSelector {...defaultProps} logo={uploadedLogo} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: /remove logo/i }));

    expect(onChange).toHaveBeenCalledWith(null);
  });
});
