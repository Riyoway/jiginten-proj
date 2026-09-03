import { afterEach, describe, expect, it, vi } from "vitest";
import { sendMessage } from "./messages";

afterEach(() => vi.restoreAllMocks());

describe("sendMessage", () => {
  it("sends text and gift id in the same request", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 204 }));

    await sendMessage({ text: "がんばれー", itemId: "heart" });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(String(init?.body))).toEqual({ text: "がんばれー", itemId: "heart" });
  });
});
