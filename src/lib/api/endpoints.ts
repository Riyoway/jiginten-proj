export const endpoints = {
  stream: import.meta.env.VITE_STREAM_URL ?? "https://intern-hls-server.tomaton.workers.dev/stream.m3u8",
  comments:
    import.meta.env.VITE_COMMENTS_URL ??
    "https://intern-comment-server.intern-comment-server.deno.net/events",
  messages:
    import.meta.env.VITE_MESSAGES_URL ??
    "https://intern-comment-server.intern-comment-server.deno.net/messages",
  gifts:
    import.meta.env.VITE_GIFTS_URL ??
    "https://intern-comment-server.intern-comment-server.deno.net/items",
} as const;
