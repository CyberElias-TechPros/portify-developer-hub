import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  server: {
    host: "0.0.0.0",
    allowedHosts: [".e2b.app", "localhost"],
    port: 8080,
    proxy: {
      "/api": {
        target: process.env.VITE_API_PROXY_TARGET || "http://127.0.0.1:8787",
        changeOrigin: true,
      },
    },
  },
  preview: { host: "0.0.0.0", allowedHosts: [".e2b.app", "localhost"], port: 4173 },
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(root, "./src") } },
});
