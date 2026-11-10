# source/tiles

**É aqui que vai o tile da arena.** Piso, variação de piso, parede de borda, pilar
interno, caixa destrutível e os frames de explosão.

Um arquivo por tile, nome em kebab-case sem acento, exatamente como em
`docs/05-assets.md`:

```
tiles/
├── piso-base.png
├── piso-variacao.png
├── parede-borda.png
├── pilar-interno.png
├── caixa.png
├── caixa-destruicao.png      # 4 frames
├── explosao-centro.png       # 3 frames
├── explosao-braco.png        # 3 frames
└── explosao-ponta.png        # 3 frames
```

Três coisas que o tile precisa atender (critérios de `docs/05-assets.md`):

- **32 × 32 exatos.** Não 34 × 34. O tile é a unidade da grade; qualquer outro
  tamanho desalinha a arena inteira.
- **Preenche o quadro de borda a borda**, sem margem transparente.
- **Colado 3 × 3 não mostra emenda.** É o teste que separa tile de ilustração.

Gere com `directions: 1`. Com `directions: 8` o PixelLab devolve 8 rotações quase
idênticas e em 34 × 34, foi o que aconteceu com a bomba, as caixas e os power-ups.

`source/` é imutável: nada de abrir e salvar por cima. Para corrigir, substitua o
arquivo inteiro. A limpeza manual vai em `processed/tiles/`.
