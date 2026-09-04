import { describe, expect, it } from "vitest";
import { hashToIndex } from "../../src/lib/hash";
import { pickRandom } from "../../src/lib/pickRandom";
import { getStreamlyUserName } from "../../src/lib/streamlyUsers";

// /channels.json が13件になった時点の実データ相当
const THIRTEEN_IDS = [
  "big-buck-bunny",
  "coffee-run",
  "cosmos-laundromat",
  "elephants-dream",
  "glass-half",
  "gran-dillama",
  "llama-drama",
  "llamigos",
  "singularity",
  "sintel",
  "spring",
  "tears-of-steel",
  "wing-it",
];

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
    const first = getStreamlyUserName("llamigos", THIRTEEN_IDS);
    expect(first).toMatch(/^Streamly User \d+$/);
    expect(getStreamlyUserName("llamigos", THIRTEEN_IDS)).toBe(first);
  });

  it("does not leak the raw id into the label", () => {
    expect(getStreamlyUserName("llamigos", THIRTEEN_IDS)).not.toContain("llamigos");
  });

  // 回帰テスト: 10個の固定プールからハッシュで選んでいた頃は、13チャンネルだと
  // 別チャンネルに同じ「Streamly User 4」が付いていた
  it("never gives two channels the same label, even past the old 10-name pool", () => {
    const names = THIRTEEN_IDS.map((id) => getStreamlyUserName(id, THIRTEEN_IDS));

    expect(new Set(names).size).toBe(THIRTEEN_IDS.length);
  });

  it("does not depend on the order the channel list arrives in", () => {
    const reversed = [...THIRTEEN_IDS].reverse();

    for (const id of THIRTEEN_IDS) {
      expect(getStreamlyUserName(id, reversed)).toBe(getStreamlyUserName(id, THIRTEEN_IDS));
    }
  });

  it("falls back to an unnumbered label for an id outside the list", () => {
    expect(getStreamlyUserName("unknown", THIRTEEN_IDS)).toBe("Streamly User");
  });
});

describe("pickRandom", () => {
  it("takes the requested number of distinct items", () => {
    const picked = pickRandom(THIRTEEN_IDS, 5);

    expect(picked).toHaveLength(5);
    expect(new Set(picked).size).toBe(5);
    for (const id of picked) expect(THIRTEEN_IDS).toContain(id);
  });

  it("never returns more than the pool holds", () => {
    expect(pickRandom(["a", "b"], 5)).toHaveLength(2);
    expect(pickRandom([], 5)).toEqual([]);
  });

  it("leaves the input array untouched", () => {
    const input = [...THIRTEEN_IDS];
    pickRandom(input, 5);

    expect(input).toEqual(THIRTEEN_IDS);
  });

  it("actually varies which items come back", () => {
    const seen = new Set<string>();
    for (let run = 0; run < 40; run += 1) seen.add(pickRandom(THIRTEEN_IDS, 5).join(","));

    expect(seen.size).toBeGreaterThan(1);
  });
});
