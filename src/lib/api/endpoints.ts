export const HLS_BASE_URL = "https://intern-hls-server.tomaton.workers.dev";

// ponytail: `??` は「定義されているが空文字」を通してしまう。ホスティング側(Vercel等)で
// VITE_* を値なしで登録すると "" が入り、`fetch("")` / `new EventSource("")` は
// **現在のページURL** へリクエストしてしまう(相対URL解決)。実際にデプロイ先で
// POST https://temp.streamly.riyo.me/watch?channel=... 404 になり、送信も受信も死んだ。
// 未設定・空・空白はすべて「未設定」として既定のエンドポイントへ落とす。
export function resolveEndpoint(value: string | undefined, fallback: string): string {
  return value?.trim() || fallback;
}

export const endpoints = {
  // 互換フォールバック: デフォルトチャンネルを再生するエンドポイント。channels取得に失敗した場合に使う。
  stream: resolveEndpoint(import.meta.env.VITE_STREAM_URL, `${HLS_BASE_URL}/stream.m3u8`),
  channels: resolveEndpoint(import.meta.env.VITE_CHANNELS_URL, `${HLS_BASE_URL}/channels.json`),
  comments: resolveEndpoint(
    import.meta.env.VITE_COMMENTS_URL,
    "https://intern-comment-server.intern-comment-server.deno.net/events",
  ),
  messages: resolveEndpoint(
    import.meta.env.VITE_MESSAGES_URL,
    "https://intern-comment-server.intern-comment-server.deno.net/messages",
  ),
  gifts: resolveEndpoint(
    import.meta.env.VITE_GIFTS_URL,
    "https://intern-comment-server.intern-comment-server.deno.net/items",
  ),
} as const;
