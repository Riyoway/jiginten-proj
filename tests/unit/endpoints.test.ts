import { describe, expect, it } from "vitest";
import { endpoints, resolveEndpoint } from "../../src/lib/api/endpoints";

const FALLBACK = "https://example.test/messages";

describe("resolveEndpoint", () => {
  it("uses the configured URL when there is one", () => {
    expect(resolveEndpoint("https://proxy.test/messages", FALLBACK)).toBe("https://proxy.test/messages");
  });

  it("falls back when the variable is not defined at all", () => {
    expect(resolveEndpoint(undefined, FALLBACK)).toBe(FALLBACK);
  });

  // 回帰テスト: `??` だと "" を通してしまい、fetch("")/new EventSource("") が現在のページURLへ
  // リクエストして404になっていた(ホスティング側でVITE_*を値なしで登録した状態)
  it("falls back when the variable is defined but blank", () => {
    expect(resolveEndpoint("", FALLBACK)).toBe(FALLBACK);
    expect(resolveEndpoint("   ", FALLBACK)).toBe(FALLBACK);
    expect(resolveEndpoint("\n\t", FALLBACK)).toBe(FALLBACK);
  });

  it("trims stray whitespace around a configured URL", () => {
    expect(resolveEndpoint("  https://proxy.test/messages  ", FALLBACK)).toBe("https://proxy.test/messages");
  });
});

describe("endpoints", () => {
  // 空のエンドポイントは相対URL扱いで自サイトへ飛ぶので、絶対URLであることを保証する
  it("are all absolute URLs, never empty", () => {
    for (const [name, url] of Object.entries(endpoints)) {
      expect(url, name).not.toBe("");
      expect(() => new URL(url), name).not.toThrow();
      expect(new URL(url).protocol, name).toMatch(/^https?:$/);
    }
  });
});
