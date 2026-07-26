import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Vite config for the DAO Treasury Tracker frontend asset canister.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      // Forward canister calls made during `npm run dev` to the local replica.
      "/api": {
        target: "http://127.0.0.1:4943",
        changeOrigin: true,
      },
    },
  },
});
