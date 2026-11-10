import { defineConfig } from "vite";

export default defineConfig({
  // assets/atlas e a pasta de folhas finais que o cliente carrega (docs/05-assets.md).
  // Servindo ela como publicDir, "/piso-provisorio.png" resolve direto, sem copiar nada.
  publicDir: "../../assets/atlas",
  server: { port: 5173 },
  build: { outDir: "dist", target: "es2023", sourcemap: true },
});
