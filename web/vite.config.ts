import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  root: ".",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "../lib/shared"),
      "@iam": path.resolve(__dirname, "../lib/iam"),
      "@collections": path.resolve(__dirname, "../lib/collections"),
    },
  },
  server: {
    port: 3000,
    host: true,
  },
});
