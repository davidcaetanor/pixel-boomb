"""
Fonte de blocos do PixelBoom: logo, digitos grandes e fonte do HUD desenhados
por codigo, sem ruido de geracao.

Cada glifo e uma grade 5x7. Nos glifos grandes cada celula vira um bloco de
CELULA px, com contorno de CONTORNO px e base marrom de BASE px, iguais em todas
as pecas. Na fonte do HUD cada celula e um pixel, com contorno de 1 px.
Uso: python glifos.py <pasta_processed> <pasta_atlas>
"""
import os
import sys
from PIL import Image

CELULA, CONTORNO, BASE = 3, 2, 4
ESCURO = (20, 18, 28, 255)
CREME = (244, 236, 216, 255)
MADEIRA = (154, 91, 46, 255)
BOMBA = (52, 50, 62, 255)
BOMBA_LUZ = (84, 82, 98, 255)
BRANCO = (255, 255, 255, 255)
LARANJA = (255, 146, 40, 255)
AMARELO = (255, 214, 72, 255)

GLIFOS = {
    "P": ["####.", "#...#", "#...#", "####.", "#....", "#....", "#...."],
    "I": ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "#####"],
    "X": ["#...#", "#...#", ".#.#.", "..#..", ".#.#.", "#...#", "#...#"],
    "E": ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
    "L": ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
    "B": ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "####."],
    "O": [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
    "M": ["#...#", "##.##", "#.#.#", "#.#.#", "#...#", "#...#", "#...#"],
    "0": [".###.", "#...#", "#..##", "#.#.#", "##..#", "#...#", ".###."],
    "1": ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".###."],
    "2": [".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#####"],
    "3": ["####.", "....#", "....#", ".###.", "....#", "....#", "####."],
    "4": ["#...#", "#...#", "#...#", "#####", "....#", "....#", "....#"],
    "5": ["#####", "#....", "####.", "....#", "....#", "#...#", ".###."],
    "6": [".###.", "#....", "#....", "####.", "#...#", "#...#", ".###."],
    "7": ["#####", "....#", "...#.", "..#..", "..#..", "..#..", "..#.."],
    "8": [".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".###."],
    "9": [".###.", "#...#", "#...#", ".####", "....#", "....#", ".###."],
}
LARG, ALT = 5 * CELULA, 7 * CELULA
MARGEM = CONTORNO


def mascara(linhas, celula):
    m = set()
    for y, linha in enumerate(linhas):
        for x, c in enumerate(linha):
            if c == "#":
                for dy in range(celula):
                    for dx in range(celula):
                        m.add((x * celula + dx, y * celula + dy))
    return m


def mascara_bomba():
    """Circulo do tamanho exato do glifo: mesma altura e linha de base."""
    r = ALT / 2
    c = (ALT - 1) / 2
    return {(x, y) for y in range(ALT) for x in range(ALT) if (x - c) ** 2 + (y - c) ** 2 <= r * r - 1}


def dilata(m, n):
    return {(x + dx, y + dy) for x, y in m for dx in range(-n, n + 1) for dy in range(-n, n + 1)}


def pinta(px, pts, cor, ox, oy):
    for x, y in pts:
        px[x + ox, y + oy] = cor


def desenha(img, m, ox, oy, preenche):
    """Base marrom so sob a borda inferior de cada coluna, contorno e preenchimento."""
    px = img.load()
    fundo = {}
    for x, y in m:
        fundo[x] = max(fundo.get(x, y), y)
    base = {(x, y) for x, b in fundo.items() for y in range(b + 1, b + 1 + BASE)}
    pinta(px, dilata(base, CONTORNO), ESCURO, ox, oy)
    pinta(px, base, MADEIRA, ox, oy)
    pinta(px, dilata(m, CONTORNO), ESCURO, ox, oy)
    preenche(px, m, ox, oy)


def preenche_creme(px, m, ox, oy):
    pinta(px, m, CREME, ox, oy)


def preenche_bomba(px, m, ox, oy):
    c = (ALT - 1) / 2
    for x, y in m:
        px[x + ox, y + oy] = BOMBA_LUZ if (x - c) + (y - c) < -2 else BOMBA
    for dx, dy in ((5, 4), (6, 4), (5, 5), (6, 5), (4, 6)):
        px[dx + ox, dy + oy] = BRANCO


def pavio(px, ox, oy):
    """Tampa, pavio curvo e faisca em cruz, acima da bomba."""
    meio = ALT // 2
    for dx in range(-2, 3):
        for dy in (-2, -1):
            px[meio + dx + ox, dy + oy] = ESCURO
    for dx in range(-1, 2):
        px[meio + dx + ox, -1 + oy] = BOMBA_LUZ
    corda = ((meio, -3), (meio, -4), (meio + 1, -5), (meio + 2, -6), (meio + 3, -6))
    for x, y in corda:
        for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            if px[x + dx + ox, y + dy + oy][3] == 0:
                px[x + dx + ox, y + dy + oy] = ESCURO
    for x, y in corda:
        px[x + ox, y + oy] = MADEIRA
    fx, fy = meio + 6, -7
    for dx, dy in ((0, -2), (-2, 0), (2, 0), (0, 2), (-1, -1), (1, 1), (1, -1), (-1, 1)):
        px[fx + dx + ox, fy + dy + oy] = ESCURO
    for dx, dy in ((0, 0), (1, 0), (-1, 0), (0, 1), (0, -1)):
        px[fx + dx + ox, fy + dy + oy] = AMARELO if (dx, dy) == (0, 0) else LARANJA


def logo():
    letras = "PIXELB*OM"
    espaco = CELULA
    largura = sum(ALT if c == "*" else LARG for c in letras) + espaco * (len(letras) - 1)
    topo = 10
    img = Image.new("RGBA", (largura + 2 * MARGEM, ALT + topo + BASE + 2 * MARGEM))
    x = MARGEM
    for c in letras:
        oy = topo + MARGEM
        if c == "*":
            desenha(img, mascara_bomba(), x, oy, preenche_bomba)
            pavio(img.load(), x, oy)
            x += ALT
        else:
            desenha(img, mascara(GLIFOS[c], CELULA), x, oy, preenche_creme)
            x += LARG
        x += espaco
    return img.crop(img.getbbox())


# Quadro do digito na grade de 8 px: 32 de altura, o glifo centrado nele.
DIGITO_QUADRO = (LARG + 2 * MARGEM, 32)
_ALTURA_DIGITO = ALT + BASE + 2 * MARGEM


def digitos():
    """Folha horizontal 0-9 em quadros de tamanho fixo, para spritesheet."""
    qw, qh = DIGITO_QUADRO
    topo = (qh - _ALTURA_DIGITO) // 2
    img = Image.new("RGBA", (qw * 10, qh))
    for i in range(10):
        desenha(img, mascara(GLIFOS[str(i)], CELULA), i * qw + MARGEM, topo + MARGEM, preenche_creme)
    return img


FONTE_HUD = {
    "A": [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
    "B": GLIFOS["B"],
    "C": [".####", "#....", "#....", "#....", "#....", "#....", ".####"],
    "D": ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
    "E": GLIFOS["E"],
    "F": ["#####", "#....", "#....", "####.", "#....", "#....", "#...."],
    "G": [".####", "#....", "#....", "#.###", "#...#", "#...#", ".###."],
    "H": ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
    "I": GLIFOS["I"],
    "J": ["..###", "....#", "....#", "....#", "#...#", "#...#", ".###."],
    "K": ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"],
    "L": GLIFOS["L"],
    "M": GLIFOS["M"],
    "N": ["#...#", "##..#", "#.#.#", "#..##", "#...#", "#...#", "#...#"],
    "O": GLIFOS["O"],
    "P": GLIFOS["P"],
    "Q": [".###.", "#...#", "#...#", "#...#", "#.#.#", "#..#.", ".##.#"],
    "R": ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
    "S": [".####", "#....", "#....", ".###.", "....#", "....#", "####."],
    "T": ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
    "U": ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
    "V": ["#...#", "#...#", "#...#", "#...#", "#...#", ".#.#.", "..#.."],
    "W": ["#...#", "#...#", "#...#", "#.#.#", "#.#.#", "##.##", "#...#"],
    "X": GLIFOS["X"],
    "Y": ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#.."],
    "Z": ["#####", "....#", "...#.", "..#..", ".#...", "#....", "#####"],
    ":": [".....", "..#..", "..#..", ".....", "..#..", "..#..", "....."],
    "/": ["....#", "....#", "...#.", "..#..", ".#...", "#....", "#...."],
    ".": [".....", ".....", ".....", ".....", ".....", "..#..", "..#.."],
    "!": ["..#..", "..#..", "..#..", "..#..", "..#..", ".....", "..#.."],
    "?": [".###.", "#...#", "....#", "...#.", "..#..", ".....", "..#.."],
    "-": [".....", ".....", ".....", ".###.", ".....", ".....", "....."],
    "*": [".....", "#.#.#", ".###.", "#####", ".###.", "#.#.#", "....."],
    "●": [".....", ".###.", "#####", "#####", "#####", ".###.", "....."],
    "○": [".....", ".###.", "#...#", "#...#", "#...#", ".###.", "....."],
    " ": [".....", ".....", ".....", ".....", ".....", ".....", "....."],
}
FONTE_HUD.update({d: GLIFOS[d] for d in "0123456789"})
FONTE_CHARS = "".join(FONTE_HUD)
FONTE_QUADRO = (7, 9)


def fonte_hud():
    """Folha em uma linha: quadros 7x9 (glifo 5x7 mais contorno de 1 px)."""
    qw, qh = FONTE_QUADRO
    img = Image.new("RGBA", (qw * len(FONTE_CHARS), qh))
    px = img.load()
    for i, ch in enumerate(FONTE_CHARS):
        m = mascara(FONTE_HUD[ch], 1)
        pinta(px, dilata(m, 1), ESCURO, i * qw + 1, 1)
        pinta(px, m, CREME, i * qw + 1, 1)
    return img


# Estrela de vitoria do placar: miolo 7x7 com contorno de 1 px, quadro 9x9 (a
# mesma altura da fonte do HUD).
ESTRELA = [
    "...#...",
    "...#...",
    "#######",
    ".#####.",
    "..###..",
    ".##.##.",
    ".#...#.",
]
OURO = (255, 200, 48, 255)
OURO_LUZ = (255, 236, 140, 255)
VAZIO = (60, 56, 76, 255)


def estrela(cheia):
    m = mascara(ESTRELA, 1)
    img = Image.new("RGBA", (9, 9))
    px = img.load()
    pinta(px, dilata(m, 1), ESCURO, 1, 1)
    pinta(px, m, OURO if cheia else VAZIO, 1, 1)
    if cheia:
        for x, y in ((3, 0), (3, 1), (2, 2)):
            px[x + 1, y + 1] = OURO_LUZ
    return img


if __name__ == "__main__":
    for pasta in sys.argv[1:3]:
        logo().save(os.path.join(pasta, "ui-logo.png"))
        digitos().save(os.path.join(pasta, "ui-digitos.png"))
        fonte_hud().save(os.path.join(pasta, "ui-fonte.png"))
        estrela(True).save(os.path.join(pasta, "ui-vitoria.png"))
        estrela(False).save(os.path.join(pasta, "ui-vitoria-vazia.png"))
    print("logo", logo().size, "digito", DIGITO_QUADRO, "fonte", FONTE_QUADRO)
    print("FONTE_CHARS", FONTE_CHARS.encode("unicode_escape").decode())
