/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_STREAM_URL: string;
  readonly VITE_CHANNELS_URL: string;
  readonly VITE_COMMENTS_URL: string;
  readonly VITE_MESSAGES_URL: string;
  readonly VITE_GIFTS_URL: string;
}
