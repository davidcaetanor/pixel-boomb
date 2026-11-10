# Pixel-Boomb

Jogo multiplayer de arena em grade, em pixel art, para navegador.

## Visão do produto

O PixelBoom é uma batalha de bombas em rodadas curtas para até 8 jogadores por
sala. Cada jogador abre caminho pelas caixas, coleta itens e tenta ser o último
de pé enquanto a arena se fecha.

A partida é decidida pelo servidor. O navegador envia só a intenção de cada
jogador, e a mesma simulação roda no servidor e no cliente, o que mantém todos
vendo o mesmo jogo.

- Arena em grade com layout de pilares e caixas sorteados a cada rodada.
- Spawns equidistantes e sorteados, com rota de fuga garantida da primeira bomba.
- Explosões em cruz com reação em cadeia entre bombas.
- Itens de mais bombas, mais alcance e mais velocidade, com teto.
- Morte súbita: a arena se fecha em anéis até restar um jogador.
- Rodadas contínuas: quem entra durante uma partida joga a próxima.

## Stack

| Pacote | Tecnologias |
|---|---|
| shared | TypeScript, Vitest |
| server | Node.js 22, Colyseus |
| client | Phaser 4, Vite, TypeScript |
