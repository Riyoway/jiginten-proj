import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    exclude: ["node_modules/**", "tests/e2e/**"],
    // テストは外部APIへ接続しないため、設定検証を通す絶対URLだけを与える。
    env: {
      VITE_STREAM_URL: "https://stream.example.test/stream.m3u8",
      VITE_CHANNELS_URL: "https://stream.example.test/channels.json",
      VITE_COMMENTS_URL: "https://comments.example.test/events",
      VITE_MESSAGES_URL: "https://comments.example.test/messages",
      VITE_GIFTS_URL: "https://comments.example.test/items",
    },
  },
});
