import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AnimatedAsciiPreview } from "./AnimatedAsciiPreview";

describe("AnimatedAsciiPreview", () => {
  let restoreCreateElement: (() => void) | null = null;

  afterEach(() => {
    vi.useRealTimers();
    restoreCreateElement?.();
    restoreCreateElement = null;
  });

  it("shows the first frame by default and advances while playing", () => {
    vi.useFakeTimers();

    render(
      <AnimatedAsciiPreview
        result={{
          frames: [
            { text: "AA", width: 2, height: 1, delayMs: 50 },
            { text: "BB", width: 2, height: 1, delayMs: 80 },
          ],
          width: 2,
          height: 1,
          frameCount: 2,
          totalDurationMs: 130,
        }}
      />,
    );

    expect(screen.getByText("AA")).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(screen.getByText("BB")).toBeTruthy();
  });

  it("continues advancing when consecutive frames use the same delay", () => {
    vi.useFakeTimers();

    render(
      <AnimatedAsciiPreview
        result={{
          frames: [
            { text: "AA", width: 2, height: 1, delayMs: 50 },
            { text: "BB", width: 2, height: 1, delayMs: 50 },
            { text: "CC", width: 2, height: 1, delayMs: 50 },
          ],
          width: 2,
          height: 1,
          frameCount: 3,
          totalDurationMs: 150,
        }}
      />,
    );

    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(screen.getByText("BB")).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(screen.getByText("CC")).toBeTruthy();
  });

  it("stops advancing when paused", () => {
    vi.useFakeTimers();

    render(
      <AnimatedAsciiPreview
        result={{
          frames: [
            { text: "AA", width: 2, height: 1, delayMs: 50 },
            { text: "BB", width: 2, height: 1, delayMs: 80 },
          ],
          width: 2,
          height: 1,
          frameCount: 2,
          totalDurationMs: 130,
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /pause/i }));
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(screen.getByText("AA")).toBeTruthy();
  });

  it("draws colored frames on a canvas instead of rendering one span per cell", () => {
    const fillText = vi.fn();
    const measureText = vi.fn(() => ({ width: 7 }));
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      if (tagName !== "canvas") {
        return originalCreateElement(tagName);
      }

      const canvas = originalCreateElement("canvas") as HTMLCanvasElement;
      Object.defineProperty(canvas, "getContext", {
        value: vi.fn(() => ({
          clearRect: vi.fn(),
          fillText,
          measureText,
          font: "",
          fillStyle: "",
          textBaseline: "",
        })),
      });
      return canvas;
    });
    restoreCreateElement = () => vi.restoreAllMocks();

    const { container } = render(
      <AnimatedAsciiPreview
        result={{
          frames: [
            {
              text: "AB",
              width: 2,
              height: 1,
              delayMs: 50,
              coloredCells: [
                { char: "A", foreground: "#ffffff" },
                { char: "B", foreground: "#ffffff" },
              ],
            },
          ],
          width: 2,
          height: 1,
          frameCount: 1,
          totalDurationMs: 50,
        }}
      />,
    );

    expect(container.querySelector(".color-preview canvas")).toBeTruthy();
    expect(container.querySelectorAll(".color-preview span")).toHaveLength(0);
    expect(fillText).toHaveBeenCalledWith("A", 0, 0);
    expect(fillText).toHaveBeenCalledWith("B", 7, 0);
  });
});
