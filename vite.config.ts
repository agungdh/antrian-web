import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter()],
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    // Dev: teruskan /api (REST + SSE) ke BE.
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
});
