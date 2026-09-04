import { render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getStreamThumbnailStorageKey, StreamThumbnail } from "../../src/features/home/StreamThumbnail";

const THUMBNAIL = "data:image/jpeg;base64,stream-frame";

vi.mock("hls.js", () => {
  class MockHls {
    static Events = { ERROR: "error", FRAG_BUFFERED: "fragBuffered" };
    static isSupported() {
      return true;
    }

    private handlers = new Map<string, (...args: never[]) => void>();

    on(event: string, handler: (...args: never[]) => void) {
      this.handlers.set(event, handler);
    }

    off(event: string) {
      this.handlers.delete(event);
    }

    loadSource() {}

    attachMedia(video: HTMLVideoElement) {
      Object.defineProperties(video, {
        readyState: { configurable: true, value: HTMLMediaElement.HAVE_CURRENT_DATA },
        videoWidth: { configurable: true, value: 320 },
        videoHeight: { configurable: true, value: 180 },
      });
      video.dispatchEvent(new Event("loadeddata"));
    }

    destroy() {}
  }

  return { default: MockHls };
});

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    drawImage: vi.fn(),
  } as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue(THUMBNAIL);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("StreamThumbnail", () => {
  it("captures the first available frame and caches it per channel", async () => {
    const { container } = render(
      <StreamThumbnail channel={{ id: "llama-drama", playlist: "/ch/llama-drama/stream.m3u8" }} />,
    );

    await waitFor(() => expect(container.querySelector("img")).toHaveAttribute("src", THUMBNAIL));
    expect(localStorage.getItem(getStreamThumbnailStorageKey("llama-drama"))).toBe(THUMBNAIL);
    expect(document.querySelector(".stream-thumbnail-capture")).not.toBeInTheDocument();
  });

  it("uses the cached frame without opening another capture video", () => {
    localStorage.setItem(getStreamThumbnailStorageKey("llama-drama"), THUMBNAIL);

    const { container } = render(
      <StreamThumbnail channel={{ id: "llama-drama", playlist: "/ch/llama-drama/stream.m3u8" }} />,
    );

    expect(container.querySelector("img")).toHaveAttribute("src", THUMBNAIL);
    expect(document.querySelector(".stream-thumbnail-capture")).not.toBeInTheDocument();
  });
});
