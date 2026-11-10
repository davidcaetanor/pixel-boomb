# PixelBoom

Jogo multiplayer de arena em grade estilo Bomberman, em pixel art, rodando no
navegador. Ate 8 jogadores por sala. Projeto de faculdade, desktop apenas.

## Stack

TypeScript strict, pnpm workspaces, Phaser 4 no render, Colyseus no netcode,
Vite no cliente, Vitest nos testes.


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
