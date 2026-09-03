import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
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
            purpose: "any maskable"
          }
        ]
      },
      workbox: {
        navigateFallback: "/index.html",
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/intern-hls-server\.tomaton\.workers\.dev\//,
            handler: "NetworkOnly"
          },
          {
            urlPattern: /^https:\/\/intern-comment-server\.intern-comment-server\.deno\.net\//,
            handler: "NetworkOnly"
          }
        ]
      }
    })
  ],
  server: {
    port: 5173,
    host: true
  },
  preview: {
    port: 4173,
    host: true
  }
});
