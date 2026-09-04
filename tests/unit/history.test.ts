import { beforeEach, describe, expect, it } from "vitest";
import { useHistoryStore } from "../../src/store/history";

beforeEach(() => {
  useHistoryStore.setState({ ids: [] });
});

describe("useHistoryStore", () => {
  it("keeps the most recently watched channel first", () => {
    const { record } = useHistoryStore.getState();
    record("a");
    record("b");

    expect(useHistoryStore.getState().ids).toEqual(["b", "a"]);
  });

  it("moves a re-watched channel back to the front instead of duplicating it", () => {
    const { record } = useHistoryStore.getState();
    record("a");
    record("b");
    record("a");

    expect(useHistoryStore.getState().ids).toEqual(["a", "b"]);
  });

  it("caps the history so the stored list cannot grow without bound", () => {
    const { record } = useHistoryStore.getState();
    for (let i = 0; i < 35; i += 1) record(`ch-${i}`);

    const { ids } = useHistoryStore.getState();
    expect(ids).toHaveLength(30);
    expect(ids[0]).toBe("ch-34");
    expect(ids).not.toContain("ch-4");
  });

  it("clears every entry", () => {
    useHistoryStore.setState({ ids: ["a", "b"] });
    useHistoryStore.getState().clear();

    expect(useHistoryStore.getState().ids).toEqual([]);
  });
});
