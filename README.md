# PixelBoom

Jogo multiplayer de arena em grade no estilo Bomberman, em pixel art, para
navegador desktop. Até 8 jogadores por sala.

Em produção: https://pixelboomb.duckdns.org

## Stack

TypeScript (strict), pnpm workspaces, Phaser 4, Colyseus, Vite e Vitest.

## Estrutura

```
packages/shared   simulação pura: domínio, regras e configuração
packages/server   sala autoritativa e servidor HTTP/WebSocket
packages/client   render, entrada e rede
assets/source     arte original
assets/atlas      texturas carregadas pelo cliente
deploy/           compose e proxy de produção
```

## Desenvolvimento

Requer Node 22 e pnpm.

```bash
pnpm install
pnpm --filter @pixelboom/shared build
pnpm dev:server
pnpm dev
```

O cliente abre em http://localhost:5173 e conecta ao servidor na porta 2567.
`?local` abre uma partida offline de um jogador.

| Comando | Descrição |
|---|---|
| `pnpm check` | lint, typecheck e testes |
| `pnpm test` | testes da simulação |
| `pnpm build` | build de todos os pacotes |

## Produção

A imagem é publicada no GHCR a cada push na `main`. No servidor:

```bash
docker compose -f deploy/docker-compose.yml pull
docker compose -f deploy/docker-compose.yml up -d
```

O container escuta só em `127.0.0.1:2567`; o HTTPS fica a cargo do proxy do
host (`deploy/Caddyfile.example`).
