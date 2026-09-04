import { beforeEach, describe, expect, it } from "vitest";
import { useCommentStore } from "../../src/store/comments";

beforeEach(() => {
  useCommentStore.setState({ messages: [], seenIds: new Set() });
});

describe("useCommentStore gift payload", () => {
  it("carries cost and animationUrl through from the SSE item", () => {
    useCommentStore.getState().push({
      id: "g1",
      item: {
        id: "clap",
        name: "拍手",
        iconUrl: "https://example.test/icons/clap.webp",
        cost: 1000,
        group: "気持ち",
        animationUrl: "https://example.test/animations/clap.webp",
      },
    });

    expect(useCommentStore.getState().messages[0].gift).toEqual({
      id: "clap",
      name: "拍手",
      iconUrl: "https://example.test/icons/clap.webp",
      cost: 1000,
      animationUrl: "https://example.test/animations/clap.webp",
    });
  });

  it("still builds a gift when the server omits the newer fields", () => {
    useCommentStore.getState().push({
      id: "g1",
      item: { id: "heart", name: "ハート", iconUrl: "https://example.test/icons/heart.webp" },
    });

    const gift = useCommentStore.getState().messages[0].gift;
    expect(gift?.name).toBe("ハート");
    expect(gift?.cost).toBeUndefined();
    expect(gift?.animationUrl).toBeNull();
  });

  it("treats an item with no name as a plain comment", () => {
    useCommentStore.getState().push({ id: "c1", text: "こんにちは", item: { id: "heart" } });

    expect(useCommentStore.getState().messages[0].gift).toBeUndefined();
  });
});
