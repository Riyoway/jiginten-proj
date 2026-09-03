import { beforeEach, describe, expect, it } from "vitest";
import { createIdSetStore } from "../../src/store/createIdSetStore";

describe("createIdSetStore", () => {
  const useTestStore = createIdSetStore("streamly-test-id-set");

  beforeEach(() => {
    useTestStore.setState({ ids: [] });
  });

  it("starts empty", () => {
    expect(useTestStore.getState().has("a")).toBe(false);
  });

  it("toggle adds an id that isn't present yet", () => {
    useTestStore.getState().toggle("a");
    expect(useTestStore.getState().has("a")).toBe(true);
    expect(useTestStore.getState().ids).toEqual(["a"]);
  });

  it("toggle removes an id that's already present", () => {
    useTestStore.getState().toggle("a");
    useTestStore.getState().toggle("a");
    expect(useTestStore.getState().has("a")).toBe(false);
    expect(useTestStore.getState().ids).toEqual([]);
  });

  it("tracks multiple ids independently", () => {
    useTestStore.getState().toggle("a");
    useTestStore.getState().toggle("b");
    expect(useTestStore.getState().has("a")).toBe(true);
    expect(useTestStore.getState().has("b")).toBe(true);

    useTestStore.getState().toggle("a");
    expect(useTestStore.getState().has("a")).toBe(false);
    expect(useTestStore.getState().has("b")).toBe(true);
  });
});
