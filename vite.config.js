import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/icon-192.png", "icons/icon-512.png"],
      manifest: {
        name: "ميزانيتي",
        short_name: "ميزانيتي",
        description: "تطبيق لإدارة الراتب والفواتير والطوارئ والمشتريات",
        start_url: "/",
        display: "standalone",
        background_color: "#F4F2ED",
        theme_color: "#5E7C63",
        dir: "rtl",
        lang: "ar",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
      workbox: {
        // يخزّن ملفات التطبيق نفسه عشان يفتح ويشتغل بدون إنترنت
        globPatterns: ["**/*.{js,css,html,png,svg,ico}"],
        // مهم: ما نخزّن ردود Open Food Facts كـ "أوفلاين ناجح" كاذب —
        // نخليها تحاول الشبكة الحقيقية دائمًا وتفشل بوضوح لو ما في نت
        navigateFallback: "/index.html",
      },
    }),
  ],
});
