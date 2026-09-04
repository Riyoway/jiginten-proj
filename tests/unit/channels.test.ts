import { describe, expect, it } from "vitest";
import { resolvePlaylistUrl, resolveSelectedChannel } from "../../src/lib/api/channels";
import type { Channel } from "../../src/lib/api/contracts";

const channels: Channel[] = [
  {
    id: "llamigos",
    title: "Caminandes 3: Llamigos",
    category: "コメディ",
    playlist: "/ch/llamigos/stream.m3u8",
    default: true,
  },
  {
    id: "llama-drama",
    title: "Caminandes 1: Llama Drama",
    category: "ドラマ",
    playlist: "/ch/llama-drama/stream.m3u8",
    default: false,
  },
];

describe("resolvePlaylistUrl", () => {
  it("resolves a relative playlist against the configured channels URL", () => {
    expect(resolvePlaylistUrl("/ch/llamigos/stream.m3u8")).toBe(
      "https://stream.example.test/ch/llamigos/stream.m3u8",
    );
  });

  it("leaves an already-absolute playlist URL untouched", () => {
    expect(resolvePlaylistUrl("https://example.com/other/stream.m3u8")).toBe(
      "https://example.com/other/stream.m3u8",
    );
  });
});

describe("resolveSelectedChannel", () => {
  it("prefers the id requested via the URL when it exists", () => {
    expect(resolveSelectedChannel(channels, "llama-drama")?.id).toBe("llama-drama");
  });

  it("falls back to the default channel when the requested id is missing", () => {
    expect(resolveSelectedChannel(channels, "does-not-exist")?.id).toBe("llamigos");
  });

  it("falls back to the default channel when no id is requested", () => {
    expect(resolveSelectedChannel(channels)?.id).toBe("llamigos");
  });

  it("falls back to the first channel when none is marked default", () => {
    const noDefault = channels.map((channel) => ({ ...channel, default: false }));
    expect(resolveSelectedChannel(noDefault)?.id).toBe("llamigos");
  });

  it("returns null when there are no channels", () => {
    expect(resolveSelectedChannel([])).toBeNull();
  });
});
