import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Při „npm run dev“ předej volání /.netlify/functions/* na „npx netlify dev“ (výchozí port 8888).
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/.netlify/functions": {
        target: "http://127.0.0.1:8888",
        changeOrigin: true,
      },
    },
  },
});
