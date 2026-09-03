import { describe, expect, it } from "vitest";
import { hashToIndex } from "../../src/lib/hash";
import { getStreamlyUserName } from "../../src/lib/streamlyUsers";

describe("hashToIndex", () => {
  it("stays within [0, mod)", () => {
    for (const value of ["a", "llamigos", "gran-dillama", ""]) {
      const index = hashToIndex(value, 10);
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(10);
    }
  });

  it("is deterministic for the same input", () => {
    expect(hashToIndex("llamigos", 10)).toBe(hashToIndex("llamigos", 10));
  });
});

describe("getStreamlyUserName", () => {
  it("returns a stable 'Streamly User N' label for the same id", () => {
    const first = getStreamlyUserName("llamigos");
    expect(first).toMatch(/^Streamly User \d+$/);
    expect(getStreamlyUserName("llamigos")).toBe(first);
  });

  it("does not leak the raw id into the label", () => {
    expect(getStreamlyUserName("llamigos")).not.toContain("llamigos");
  });
});
