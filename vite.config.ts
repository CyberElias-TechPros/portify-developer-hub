import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

const API_TARGET = process.env.VITE_API_TARGET || "http://127.0.0.1:8787";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: true,
    port: 8080,
    // The sandbox preview proxies this dev server through a public hostname.
    allowedHosts: true,
    proxy: {
      // Everything the Worker owns is proxied so the browser only ever talks
      // to one origin — exactly like production.
      "/api": { target: API_TARGET, changeOrigin: false, ws: false },
      "/sitemap.xml": { target: API_TARGET, changeOrigin: false },
      "/rss.xml": { target: API_TARGET, changeOrigin: false },
      "/robots.txt": { target: API_TARGET, changeOrigin: false },
    },
  },
  preview: {
    host: true,
    port: 8080,
    allowedHosts: true,
    proxy: {
      "/api": { target: API_TARGET, changeOrigin: false },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "es2020",
    sourcemap: false,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          motion: ["framer-motion"],
          charts: ["recharts"],
        },
      },
    },
  },
}));
