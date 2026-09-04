export const HLS_BASE_URL = "https://intern-hls-server.tomaton.workers.dev";

export const endpoints = {
  // 互換フォールバック: デフォルトチャンネルを再生するエンドポイント。channels取得に失敗した場合に使う。
  stream: import.meta.env.VITE_STREAM_URL ?? `${HLS_BASE_URL}/stream.m3u8`,
  channels: import.meta.env.VITE_CHANNELS_URL ?? `${HLS_BASE_URL}/channels.json`,
  comments:
    import.meta.env.VITE_COMMENTS_URL ??
    "https://intern-comment-server.intern-comment-server.deno.net/events",
  messages:
    import.meta.env.VITE_MESSAGES_URL ??
    "https://intern-comment-server.intern-comment-server.deno.net/messages",
  gifts:
    import.meta.env.VITE_GIFTS_URL ?? "https://intern-comment-server.intern-comment-server.deno.net/items",
} as const;
