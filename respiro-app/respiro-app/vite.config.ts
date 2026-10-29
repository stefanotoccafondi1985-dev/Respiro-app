import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// BASE_PATH viene impostato dal workflow GitHub (es. /respiro/).
// In locale resta "/".
export default defineConfig({
  base: process.env.BASE_PATH ?? "/",
  define: { __BUILD_TIME__: JSON.stringify(new Date().toISOString()) },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "icons/*.png"],
      manifest: {
        name: "Respiro",
        short_name: "Respiro",
        description: "Tabelle CO2 e O2, pranayama e meditazioni guidate in italiano.",
        lang: "it",
        display: "standalone",
        orientation: "portrait",
        background_color: "#0A131A",
        theme_color: "#0A131A",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: { globPatterns: ["**/*.{js,css,html,svg,png,woff2}"] },
    }),
  ],
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
