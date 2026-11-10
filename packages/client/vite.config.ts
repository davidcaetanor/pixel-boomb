import { defineConfig } from "vite";

export default defineConfig({
  // As texturas finais ficam em assets/atlas e sao servidas na raiz.
  publicDir: "../../assets/atlas",
  server: { port: 5173 },
  build: { outDir: "dist", target: "es2023", sourcemap: true },
});
