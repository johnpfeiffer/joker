import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { SiteFooter } from "johnutilsjs/ui";

describe("SiteFooter (shared johnutilsjs footer)", () => {
  it("renders the built-by line with LinkedIn and GitHub links to this repo", () => {
    render(<SiteFooter repo="joker" />);
    expect(screen.getByText(/Built by John Pfeiffer/i)).toBeInTheDocument();

    const linkedin = screen.getByLabelText("John Pfeiffer on LinkedIn");
    expect(linkedin).toHaveAttribute("href", "https://www.linkedin.com/in/foupfeiffer");
    expect(linkedin).toHaveAttribute("target", "_blank");
    expect(linkedin).toHaveAttribute("rel", "noopener noreferrer");

    const github = screen.getByLabelText("Source code on GitHub");
    expect(github).toHaveAttribute("href", "https://github.com/johnpfeiffer/joker");
    expect(github).toHaveAttribute("target", "_blank");
    expect(github).toHaveAttribute("rel", "noopener noreferrer");
  });
});
