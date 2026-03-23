import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Forward all these API paths from :5173 → :8000
      // Browser sees same origin (5173), no CORS needed
      "/auth": "http://localhost:8000",
      "/users": "http://localhost:8000",
      "/complaints": "http://localhost:8000",
      "/notifications": "http://localhost:8000",
      "/departments": "http://localhost:8000",
      "/ratings": "http://localhost:8000",
      "/api": "http://localhost:8000",
    },
  },
});
