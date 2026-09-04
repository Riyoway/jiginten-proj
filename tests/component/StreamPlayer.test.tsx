import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StreamPlayer } from "../../src/features/player/StreamPlayer";
import { usePreferenceStore } from "../../src/store/preferences";

beforeEach(() => {
  usePreferenceStore.setState({
    muted: true,
    volume: 0.8,
    danmakuEnabled: true,
    danmakuOpacity: 0.92,
    chatVisible: true,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("StreamPlayer", () => {
  it("autoplays again when the channel source changes", async () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, "play");
    const { rerender } = render(<StreamPlayer source="/ch/first/stream.m3u8" />);

    await waitFor(() => expect(play).toHaveBeenCalledTimes(1));

    rerender(<StreamPlayer source="/ch/second/stream.m3u8" />);

    await waitFor(() => expect(play).toHaveBeenCalledTimes(2));
  });

  it("falls back to muted autoplay when browser policy rejects audio autoplay", async () => {
    usePreferenceStore.setState({ muted: false });
    const play = vi
      .spyOn(HTMLMediaElement.prototype, "play")
      .mockRejectedValueOnce(new Error("autoplay blocked"))
      .mockResolvedValueOnce(undefined);

    render(<StreamPlayer source="/ch/first/stream.m3u8" />);

    await waitFor(() => {
      expect(play).toHaveBeenCalledTimes(2);
      expect(usePreferenceStore.getState().muted).toBe(true);
    });
  });

  it("updates the saved volume from the native volume slider", () => {
    render(<StreamPlayer source="/ch/first/stream.m3u8" />);

    const slider = screen.getByRole("slider", { name: "音量 80%" });
    fireEvent.change(slider, { target: { value: "0.35" } });

    expect(usePreferenceStore.getState().volume).toBe(0.35);
    expect(slider).toHaveValue("0.35");
  });
});
