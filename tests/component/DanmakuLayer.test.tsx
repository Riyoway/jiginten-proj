import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DanmakuLayer } from "../../src/features/danmaku/DanmakuLayer";
import { useCommentStore } from "../../src/store/comments";
import { usePreferenceStore } from "../../src/store/preferences";

beforeEach(() => {
  useCommentStore.setState({ messages: [], seenIds: new Set() });
  usePreferenceStore.setState({ danmakuEnabled: true });
});

afterEach(() => {
  useCommentStore.getState().clear();
});

function push(id: string, text: string) {
  act(() => {
    useCommentStore.getState().push({ id, text });
  });
}

function items(container: HTMLElement) {
  return Array.from(container.querySelectorAll(".danmaku-item")).map((el) => el.textContent);
}

describe("DanmakuLayer", () => {
  it("shows comments that arrive after mount", () => {
    const { container } = render(<DanmakuLayer />);

    push("c1", "こんにちは");
    expect(items(container)).toEqual(["こんにちは"]);
  });

  it("does not replay the backlog that already existed at mount", () => {
    push("old", "前のコメント");
    const { container } = render(<DanmakuLayer />);

    expect(items(container)).toEqual([]);
  });

  // 回帰テスト: store が上限300件に達すると push が append+shift になり messages.length が
  // 300 に張り付く。件数差分で新着を判定していたため、それ以降の弾幕が永久に出なくなっていた。
  it("keeps showing comments after the store hits its 300 message cap", () => {
    for (let i = 0; i < 300; i += 1) push(`seed-${i}`, `seed ${i}`);
    const { container } = render(<DanmakuLayer />);
    expect(useCommentStore.getState().messages).toHaveLength(300);

    push("late", "上限に達した後のコメント");

    expect(items(container)).toEqual(["上限に達した後のコメント"]);
  });
});
