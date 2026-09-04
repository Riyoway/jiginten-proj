import { act, fireEvent, render, screen } from "@testing-library/react";
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
  vi.useRealTimers();
});

function push(id: string, text: string) {
  act(() => {
    useCommentStore.getState().push({ id, text } as IncomingComment);
  });
}

function pushGift(id: string, animationUrl: string | null = null) {
  act(() => {
    useCommentStore.getState().push({
      id,
      text: "ギフトを送りました",
      item: { id: "heart", name: "ハート", iconUrl: "/heart.png", cost: 10, animationUrl },
    });
  });
}

describe("ChatPanel", () => {
  it("shows the empty state and does not scroll when there are no messages", () => {
    render(<ChatPanel />);

    expect(screen.getByText("コメントを待っています")).toBeInTheDocument();
    expect(screen.queryByText("接続中")).not.toBeInTheDocument();
    expect(screen.queryByText("再接続中")).not.toBeInTheDocument();
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

  it("filters messages by type", () => {
    push("c1", "こんにちは");
    pushGift("g1");
    render(<ChatPanel />);

    expect(screen.getByText("こんにちは")).toBeInTheDocument();
    expect(screen.getByText("ハート")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "ギフト" }));

    expect(screen.queryByText("こんにちは")).not.toBeInTheDocument();
    expect(screen.getByText("ハート")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "メッセージ" }));

    expect(screen.getByText("こんにちは")).toBeInTheDocument();
    expect(screen.queryByText("ハート")).not.toBeInTheDocument();
  });

  it("stops an animated chat gift after 5 seconds", () => {
    vi.useFakeTimers();
    pushGift("g1", "https://example.test/animations/heart.webp");
    render(<ChatPanel />);

    const image = () => document.querySelector(".gift-highlight-image");
    expect(image()).toHaveAttribute("src", "https://example.test/animations/heart.webp");

    act(() => vi.advanceTimersByTime(4999));
    expect(image()).toHaveAttribute("src", "https://example.test/animations/heart.webp");

    act(() => vi.advanceTimersByTime(1));
    expect(image()).toHaveAttribute("src", "/heart.png");
  });

  it("shows the follow notice locally and hides it from the gift filter", () => {
    render(<ChatPanel followNotice="Guestさんがこの配信をフォローしました！" />);

    expect(screen.getByText("Guestさんがこの配信をフォローしました！")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "ギフト" }));

    expect(screen.queryByText("Guestさんがこの配信をフォローしました！")).not.toBeInTheDocument();
  });

  it("hides the follow notice after it flows away", () => {
    vi.useFakeTimers();
    render(<ChatPanel followNotice="Guestさんがこの配信をフォローしました！" />);

    expect(screen.getByText("Guestさんがこの配信をフォローしました！")).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(4000));

    expect(screen.queryByText("Guestさんがこの配信をフォローしました！")).not.toBeInTheDocument();
  });
});
