# PixelBoom

Jogo multiplayer de arena em grade estilo Bomberman, em pixel art, rodando no
navegador. Ate 8 jogadores por sala. Projeto de faculdade, desktop apenas.

As regras de trabalho estao em [`CLAUDE.md`](CLAUDE.md).

A documentacao completa (visao, game design, arquitetura, arte, checklist, tiles e
objects, como rodar) vive em `docs/` e **nao e versionada**, fica so na maquina de
quem desenvolve. Se voce clonou este repositorio e precisa dela, peca ao David.

## Stack

TypeScript strict, pnpm workspaces, Phaser 4 no render, Colyseus no netcode,
Vite no cliente, Vitest nos testes.

## Rodar local

Requer Node 22+ e pnpm.

```bash
pnpm install
pnpm --filter @pixelboom/shared build   # shared e consumido via dist
pnpm dev                                # cliente em http://localhost:5173
```

## Comandos

| Comando | O que faz |
|---|---|
| `pnpm check` | lint + typecheck + testes |
| `pnpm lint` | ESLint, inclusive a regra de pureza de `shared/` |
| `pnpm typecheck` | `tsc --noEmit` nos tres pacotes |
| `pnpm test` | Vitest em `packages/shared` |
| `pnpm dev` | cliente Vite |
| `pnpm dev:server` | servidor em watch |
| `pnpm build` | build dos tres pacotes |

## Estrutura

```
packages/shared   dominio, regras, config. 
packages/server   autoridade e rede 
packages/client   render, entrada e predicao 
assets/
  source/       
    characters/   os 8 personagens, 8 direcoes
    tiles/        piso, parede, pilar, caixa, explosao
    objects/      entidades: bomba, power-ups
    ui/           HUD
  processed/      limpeza manual
  atlas/                     
```
