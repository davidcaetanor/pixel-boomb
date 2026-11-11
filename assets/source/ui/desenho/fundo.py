"""
Fundo do lobby e da sala: uma arena montada com os tiles do proprio jogo, com
o centro livre para o painel. Sem geracao: muda junto quando os tiles mudam.
Uso: python fundo.py <pasta_atlas> <pasta_processed>
"""
import os
import random
import sys

from PIL import Image

T, COLUNAS, LINHAS = 32, 30, 17
CENTRO_LIVRE = (11, 19, 5, 12)  # x0, x1, y0, y1 em celulas
CHANCE_CAIXA, CHANCE_BOMBA = 0.38, 0.43
SEMENTE = 7

if __name__ == "__main__":
    atlas, processed = sys.argv[1:3]
    carrega = lambda n: Image.open(os.path.join(atlas, n + ".png")).convert("RGBA")  # noqa: E731
    claro, escuro, arvore, arvore_p, caixa, pilar, bomba = (
        carrega(n)
        for n in ("piso-claro", "piso-escuro", "arvore-provisorio", "arvore-p-provisorio", "caixa", "pilar", "bomba-provisorio")
    )
    rng = random.Random(SEMENTE)
    img = Image.new("RGBA", (COLUNAS * T, LINHAS * T))
    x0, x1, y0, y1 = CENTRO_LIVRE
    for y in range(LINHAS):
        for x in range(COLUNAS):
            img.alpha_composite(claro if (x + y) % 2 == 0 else escuro, (x * T, y * T))
            borda = x in (0, COLUNAS - 1) or y in (0, LINHAS - 1)
            if borda:
                img.alpha_composite(arvore if (x + y) % 3 else arvore_p, (x * T, y * T))
            elif x0 <= x < x1 and y0 <= y < y1:
                continue
            elif x % 2 == 0 and y % 2 == 0:
                img.alpha_composite(pilar, (x * T, y * T))
            else:
                r = rng.random()
                if r < CHANCE_CAIXA:
                    img.alpha_composite(caixa, (x * T, y * T))
                elif r < CHANCE_BOMBA:
                    img.alpha_composite(bomba, (x * T, y * T))
    for pasta in (atlas, processed):
        img.save(os.path.join(pasta, "ui-fundo.png"), optimize=True)
    print("fundo", img.size)
