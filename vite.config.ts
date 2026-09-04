import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import { resolveEndpoints } from "./src/lib/api/endpointConfig.ts";

export default defineConfig(({ mode }) => {
  // Viteは設定評価後に.envを読むため、設定漏れをdev/build開始前に止めるにはここで明示的に読む。
  // 外部APIをruntimeCachingに登録しない。特にSSEをWorkbox経由にすると、EventSourceの
  // 再接続時にバックエンドが許可していないCORS preflightが発生するため、ブラウザから直接送る。
  resolveEndpoints(loadEnv(mode, process.cwd(), "VITE_"));

  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon.png"],
        manifest: {
          name: "Streamly",
          short_name: "Streamly",
          description: "ライブ配信・チャット・ギフトを楽しめるストリーミングサービス",
          theme_color: "#080b12",
          background_color: "#080b12",
          display: "standalone",
          start_url: "/",
          icons: [
            {
              src: "/favicon.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable",
            },
          ],
        },
        workbox: {
          navigateFallback: "/index.html",
        },
      }),
    ],
    server: {
      port: 5173,
      host: true,
    },
    preview: {
      port: 4173,
      host: true,
    },
  };
});
