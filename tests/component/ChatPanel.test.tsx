import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ChatPanel } from "../../src/features/chat/ChatPanel";
import type { IncomingComment } from "../../src/lib/api/contracts";
import { useCommentStore } from "../../src/store/comments";

// ponytail: jsdomのElement.scrollToはsetup.tsのno-opなので、呼ばれたかどうかだけspyで見る。
const scrollTo = vi.fn();

beforeEach(() => {
  Element.prototype.scrollTo = scrollTo;
  scrollTo.mockClear();
  useCommentStore.setState({ messages: [], seenIds: new Set() });
});

afterEach(() => {
  useCommentStore.getState().clear();
});

function push(id: string, text: string) {
  act(() => {
    useCommentStore.getState().push({ id, text } as IncomingComment);
  });
}

describe("ChatPanel", () => {
  it("shows the empty state and does not scroll when there are no messages", () => {
    render(<ChatPanel />);

    expect(screen.getByText("コメントを待っています")).toBeInTheDocument();
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("scrolls to the bottom as new comments arrive", () => {
    push("c1", "はじめまして");
    render(<ChatPanel />);
    expect(scrollTo).toHaveBeenCalledTimes(1);

    push("c2", "こんばんは");
    expect(scrollTo).toHaveBeenCalledTimes(2);
    expect(scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ behavior: "smooth" }));
    expect(screen.getByText("こんばんは")).toBeInTheDocument();
  });
});
