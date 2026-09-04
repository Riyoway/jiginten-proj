import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GiftOverlay } from "../../src/features/player/GiftOverlay";
import { useCommentStore } from "../../src/store/comments";

const ICON = "https://example.test/icons/clap.webp?v=1";
const animation = (n: number) => `https://example.test/animations/clap${n}.webp?v=1`;

beforeEach(() => {
  vi.useFakeTimers();
  useCommentStore.setState({ messages: [], seenIds: new Set() });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  useCommentStore.getState().clear();
});

function pushGift(id: string, animationUrl: string | null) {
  act(() => {
    useCommentStore.getState().push({
      id,
      item: { id: "clap", name: "拍手", iconUrl: ICON, cost: 1000, animationUrl },
    });
  });
}

// alt="" は role="presentation" なので getByRole("img") では取れない
function shown(container: HTMLElement) {
  return Array.from(container.querySelectorAll(".gift-overlay img")).map((img) => img.getAttribute("src"));
}

describe("GiftOverlay", () => {
  it("plays an arriving animated gift and stops after exactly 5s", () => {
    const { container } = render(<GiftOverlay />);
    expect(container.querySelector(".gift-overlay")).toBeNull();

    pushGift("g1", animation(1));
    expect(shown(container)).toEqual([animation(1)]);

    act(() => {
      vi.advanceTimersByTime(4999);
    });
    expect(shown(container)).toEqual([animation(1)]);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(shown(container)).toEqual([]);
    expect(container.querySelector(".gift-overlay")).toBeNull();
  });

  it("ignores gifts without an animation and plain comments", () => {
    const { container } = render(<GiftOverlay />);

    pushGift("g1", null);
    act(() => {
      useCommentStore.getState().push({ id: "c1", text: "こんにちは" });
    });

    expect(shown(container)).toEqual([]);
  });

  it("gives each gift its own independent 5s window", () => {
    const { container } = render(<GiftOverlay />);

    pushGift("g1", animation(1));
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    pushGift("g2", animation(2));

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(shown(container)).toEqual([animation(2)]);

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(shown(container)).toEqual([]);
  });

  it("caps concurrent animations and keeps the newest", () => {
    const { container } = render(<GiftOverlay />);

    for (const n of [1, 2, 3, 4]) pushGift(`g${n}`, animation(n));

    expect(shown(container)).toEqual([animation(2), animation(3), animation(4)]);
  });

  it("does not replay the backlog that existed before mount", () => {
    pushGift("old", animation(1));
    const { container } = render(<GiftOverlay />);

    expect(shown(container)).toEqual([]);
  });

  // 回帰テスト: 件数差分で新着判定していた頃は、storeが上限300件に達すると以降が出なくなった
  it("still plays gifts after the store hits its 300 message cap", () => {
    for (let i = 0; i < 300; i += 1) {
      act(() => {
        useCommentStore.getState().push({ id: `seed-${i}`, text: "x" });
      });
    }
    const { container } = render(<GiftOverlay />);
    expect(useCommentStore.getState().messages).toHaveLength(300);

    pushGift("late", animation(1));

    expect(shown(container)).toEqual([animation(1)]);
  });

  it("clears pending timers on unmount", () => {
    const { unmount } = render(<GiftOverlay />);
    pushGift("g1", animation(1));

    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });

  it("shows the static icon instead of the animation under reduced motion", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: true })),
    );
    const { container } = render(<GiftOverlay />);

    pushGift("g1", animation(1));
    expect(shown(container)).toEqual([ICON]);

    // 動かさないだけで、5秒の表示自体は変えない
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(shown(container)).toEqual([]);
  });

  it("falls back to the static icon when the animation fails to load", () => {
    const { container } = render(<GiftOverlay />);
    pushGift("g1", animation(1));

    const image = container.querySelector(".gift-overlay img");
    if (!image) throw new Error("overlay image not found");
    fireEvent.error(image);

    expect(shown(container)).toEqual([ICON]);
  });
});
