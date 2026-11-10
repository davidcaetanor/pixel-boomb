# CLAUDE.md, PixelBoom

Leia este arquivo inteiro antes da primeira alteração de código em qualquer sessão.
Os documentos de apoio estão em `docs/`. Leia `docs/03-arquitetura.md` antes de criar
qualquer arquivo novo e `docs/02-game-design.md` antes de mexer em qualquer número.

---

## 1. O que é o projeto

Jogo multiplayer online de arena em grade no estilo Bomberman, em pixel art, rodando
no navegador. Até 8 jogadores simultâneos por sala. Entrega como projeto de faculdade,
com prazo fixo. Desktop apenas, mobile foi descartado deliberadamente.

**Não é** um jogo comercial, não precisa de contas de usuário, não precisa de banco de
dados, não precisa de ranking persistente.

---

## 2. A regra inviolável

`packages/shared` é a **simulação pura** do jogo e não pode importar nada de fora dela.

Proibido dentro de `shared/`:

- `phaser`, `colyseus`, `@colyseus/*`
- qualquer API de DOM (`window`, `document`, `canvas`, `localStorage`)
- qualquer API de Node (`fs`, `path`, `process`, `http`)
- `Math.random()` sem semente, use o RNG com semente de `shared/src/simulation/rng.ts`
- `Date.now()` / `performance.now()`, o tempo entra como parâmetro `dt`

Motivo: o mesmo código de simulação roda no cliente (predição) e no servidor
(autoridade). Se eles divergirem, o jogo treme e teleporta, e esse bug é quase
impossível de depurar. Uma fonte de verdade, sempre.

A dependência corre em uma direção só:

```
shared  ←  server
shared  ←  client
```

Nunca o contrário. Nunca `shared` importando de `server` ou `client`.

---

## 3. Stack

| Camada | Tecnologia |
|---|---|
| Linguagem | TypeScript, modo strict |
| Build | Vite (cliente), tsc (shared e server) |
| Monorepo | pnpm workspaces |
| Render | Phaser 4 |
| Rede | Colyseus (WebSocket) |
| Runtime do servidor | Node LTS |
| Hospedagem | Fly.io ou Railway, serviço único servindo estático + WebSocket |
| Testes | Vitest, com foco em `shared/` |

Não adicione dependência nova sem necessidade concreta. Em particular: não introduza
biblioteca de ECS, gerenciador de estado, framework de UI nem engine de física.

---

## 4. Onde cada coisa mora

Ver `docs/03-arquitetura.md` para a árvore completa. Resumo:

- **Regra de jogo** → `packages/shared/src/rules/`
- **Tipos e entidades** → `packages/shared/src/domain/`
- **Números de balanceamento** → `packages/shared/src/config/balance.ts`, e só lá
- **Layout da arena** → `packages/shared/src/config/arena.ts`
- **Sala e autoridade** → `packages/server/src/rooms/`
- **Desenho e cena** → `packages/client/src/render/`
- **Entrada do jogador** → `packages/client/src/input/`
- **Predição e interpolação** → `packages/client/src/net/`

Se você está prestes a escrever lógica de bomba dentro de um `Sprite` do Phaser ou de
um `Schema` do Colyseus, pare: ela pertence a `shared/src/rules/`.

---

## 5. Números

Todo valor numérico de jogo vive em `shared/src/config/balance.ts`. Nenhum número
mágico espalhado pelo código.

Se precisar de um valor que não está lá, adicione lá com nome descritivo em vez de
escrever o literal no ponto de uso.

---

## 6. Fluxo de Git

- Pode criar branch, commitar, fazer push e abrir PR. **O merge é sempre do David.**
- Nunca commitar na `main`. Nunca force-push.
- `git add` só com caminhos explícitos. Nunca `.`, nunca `-A`.
- Mensagem em Conventional Commits: tipo em inglês, descrição em português, minúscula,
  uma linha, sem corpo.
  - `feat: adiciona propagação de explosão em cruz`
  - `fix: corrige colisão do jogador com parede destrutível`
- Nunca adicionar linha de co-autoria, crédito ou link de sessão, nem no commit nem
  no corpo do PR.

---

## 7. Como trabalhar

- **Simulação primeiro, visual depois.** Uma regra nova nasce em `shared/` com teste,
  e só então aparece na tela.
- **Teste o que é puro.** `shared/` deve ter cobertura real; render e rede não precisam.
- **Passo fixo.** A simulação roda a 30 Hz com acumulador. O render roda na taxa do
  monitor. Nunca amarre um ao outro.
- **Não otimize.** 8 jogadores e ~325 células. Performance não é um problema neste
  projeto; legibilidade é.
- **Escopo é o inimigo.** Antes de implementar algo que não está em
  `docs/06-checklist.md`, pergunte.

---

## 8. O que nunca fazer

- Duplicar regra de jogo entre cliente e servidor
- Ler estado do Phaser para decidir regra
- Usar o estado do Colyseus como se fosse o modelo de domínio
- Introduzir aleatoriedade sem semente em qualquer código de `shared/`
- Confiar em entrada do cliente sem validação no servidor
- Adicionar feature que não está no checklist
