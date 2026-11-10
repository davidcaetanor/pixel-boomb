// Regra de dependencia do projeto, imposta por lint e nao por disciplina.
// Ver CLAUDE.md secao 2 e docs/03-arquitetura.md.
import js from "@eslint/js";
import tseslint from "typescript-eslint";

const PURO =
  "packages/shared e simulacao pura: nada de Phaser, Colyseus, DOM, Node, " +
  "relogio ou aleatoriedade sem semente. Ver CLAUDE.md secao 2.";

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/.vite/**",
      "**/*.d.ts",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // A regra inviolavel: shared/ nao conhece ninguem.
  // ---------------------------------------------------------------------------
  {
    files: ["packages/shared/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["phaser", "phaser/*"], message: PURO },
            {
              group: ["colyseus", "colyseus.js", "@colyseus/*"],
              message: PURO,
            },
            { group: ["node:*"], message: PURO },
            {
              group: [
                "fs",
                "fs/*",
                "path",
                "process",
                "http",
                "https",
                "os",
                "crypto",
                "child_process",
                "worker_threads",
              ],
              message: PURO,
            },
            {
              group: ["@pixelboom/server", "@pixelboom/client"],
              message:
                "A dependencia corre em uma direcao so: server e client importam shared, nunca o contrario.",
            },
          ],
        },
      ],
      "no-restricted-globals": [
        "error",
        { name: "window", message: PURO },
        { name: "document", message: PURO },
        { name: "localStorage", message: PURO },
        { name: "sessionStorage", message: PURO },
        { name: "navigator", message: PURO },
        { name: "location", message: PURO },
        { name: "fetch", message: PURO },
        { name: "requestAnimationFrame", message: PURO },
        { name: "process", message: PURO },
        { name: "Buffer", message: PURO },
        { name: "__dirname", message: PURO },
        { name: "__filename", message: PURO },
        { name: "performance", message: PURO },
      ],
      "no-restricted-properties": [
        "error",
        {
          object: "Math",
          property: "random",
          message:
            "Use o RNG com semente de shared/src/simulation/rng.ts. Aleatoriedade sem semente faz cliente e servidor divergirem.",
        },
        {
          object: "Date",
          property: "now",
          message: "O tempo entra como parametro dt, nunca lido do relogio.",
        },
        {
          object: "performance",
          property: "now",
          message: "O tempo entra como parametro dt, nunca lido do relogio.",
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "NewExpression[callee.name='Date']",
          message: "O tempo entra como parametro dt, nunca lido do relogio.",
        },
      ],
    },
  },

  // Testes de shared podem usar relogio e random livremente.
  {
    files: ["packages/shared/tests/**/*.ts"],
    rules: {
      "no-restricted-properties": "off",
      "no-restricted-syntax": "off",
      "no-restricted-globals": "off",
    },
  },

  // O render e a rede sao a casca imperativa: aqui DOM e Phaser sao esperados.
  {
    files: ["packages/client/**/*.ts"],
    languageOptions: { globals: { window: "readonly", document: "readonly" } },
  },
);
