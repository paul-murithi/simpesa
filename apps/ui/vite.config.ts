import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";

// https://vite.dev/config/
export default defineConfig({
  root: resolve(__dirname),
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:33000",
        changeOrigin: true,
      },
      "/stkpush": {
        target: "http://localhost:33000",
        changeOrigin: true,
      },
      "/oauth": {
        target: "http://localhost:33000",
        changeOrigin: true,
      },
      "/health": {
        target: "http://localhost:33000",
        changeOrigin: true,
      },
    },
  },
});
