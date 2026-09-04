import { beforeEach, describe, expect, it } from "vitest";
import { useCreditStore } from "../../src/store/credits";

beforeEach(() => {
  useCreditStore.setState({ balance: 3000 });
});

describe("useCreditStore", () => {
  it("starts Guest with 3000 credits", () => {
    // persistの復元前(localStorageが空)の初期値がそのまま既定残高になる
    expect(useCreditStore.getInitialState().balance).toBe(3000);
  });

  it("subtracts the gift cost from the balance", () => {
    useCreditStore.getState().spend(1000);
    expect(useCreditStore.getState().balance).toBe(2000);

    useCreditStore.getState().spend(150);
    expect(useCreditStore.getState().balance).toBe(1850);
  });

  it("never goes negative", () => {
    useCreditStore.setState({ balance: 10 });
    useCreditStore.getState().spend(1000);

    expect(useCreditStore.getState().balance).toBe(0);
  });
});
