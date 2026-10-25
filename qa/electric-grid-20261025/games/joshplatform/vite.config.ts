import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isGitHubPages = process.env.GITHUB_PAGES === "true";

export default defineConfig({
  base: isGitHubPages ? "/JoshPlatform/" : "/",
  plugins: [react(), tailwindcss()],
  root: "client",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client/src"),
    },
  },
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
});
