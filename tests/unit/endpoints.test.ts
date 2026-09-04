import { describe, expect, it } from "vitest";
import { resolveEndpoints } from "../../src/lib/api/endpointConfig";
import { endpoints } from "../../src/lib/api/endpoints";

const VALID_ENV = {
  VITE_CHANNELS_URL: "https://stream.example.test/channels.json",
  VITE_COMMENTS_URL: "https://comments.example.test/events",
  VITE_MESSAGES_URL: "https://comments.example.test/messages",
  VITE_GIFTS_URL: "https://comments.example.test/items",
};

describe("resolveEndpoints", () => {
  it("maps and trims every required endpoint", () => {
    expect(resolveEndpoints({ ...VALID_ENV, VITE_MESSAGES_URL: "  https://proxy.test/messages  " })).toEqual({
      channels: VALID_ENV.VITE_CHANNELS_URL,
      comments: VALID_ENV.VITE_COMMENTS_URL,
      messages: "https://proxy.test/messages",
      gifts: VALID_ENV.VITE_GIFTS_URL,
    });
  });

  it.each([undefined, "", "   "])("rejects a missing or blank endpoint (%s)", (value) => {
    expect(() => resolveEndpoints({ ...VALID_ENV, VITE_MESSAGES_URL: value })).toThrow(
      "VITE_MESSAGES_URL is required",
    );
  });

  it.each(["/messages", "not-a-url", "ftp://example.test/messages"])(
    "rejects an invalid URL (%s)",
    (value) => {
      expect(() => resolveEndpoints({ ...VALID_ENV, VITE_MESSAGES_URL: value })).toThrow(
        "VITE_MESSAGES_URL must be an absolute HTTP(S) URL",
      );
    },
  );
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
