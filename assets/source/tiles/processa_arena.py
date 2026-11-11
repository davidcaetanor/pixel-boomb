"""
Processa as pecas da arena geradas no PixelLab para o atlas: reduz a paleta
sem pontilhado, limpa pixels orfaos de baixo contraste, fecha o contorno escuro
quando falta e centraliza o conteudo na celula de 32 px.

O piso escuro do xadrez nao e gerado: sai do claro, com o tom de base mais
fundo, os tufos espelhados e sem a flor, para os dois combinarem exatamente.
Uso: python processa_arena.py <assets/source> <pasta_processed> <pasta_atlas>
"""
import os
import sys

from PIL import Image

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "ui", "desenho"))
from processa_kit import binariza_alfa, limpa  # noqa: E402

CELULA = 32
ESCURO = (20, 18, 28, 255)
GRAMA_BASE = (124, 194, 74, 255)
GRAMA_BASE_ESCURA = (106, 176, 62, 255)
GRAMA_FLOR = (244, 226, 122, 255)

# nome no atlas: (arquivo de origem, cores maximas, fecha contorno)
PECAS = {
    "caixa": ("tiles/wood_box_v2/wood_box.png", 10, True),
    "pilar": ("tiles/stone_block_v2/stone_block.png", 10, False),
    "powerup-bomba": ("objects/powerup_round/bomb.png", 12, False),
    "powerup-alcance": ("objects/powerup_round/range.png", 12, False),
    "powerup-velocidade": ("objects/powerup_round/speed.png", 12, False),
}


def reduz_paleta(im, cores):
    alfa = im.getchannel("A")
    rgb = im.convert("RGB").quantize(colors=cores, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    out = rgb.convert("RGBA")
    out.putalpha(alfa)
    return out


def fecha_contorno(im):
    """Pixel opaco vizinho de transparente vira contorno escuro."""
    px = im.load()
    w, h = im.size
    borda = []
    for y in range(h):
        for x in range(w):
            if px[x, y][3] == 0:
                continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                X, Y = x + dx, y + dy
                if not (0 <= X < w and 0 <= Y < h) or px[X, Y][3] == 0:
                    borda.append((x, y))
                    break
    for x, y in borda:
        px[x, y] = ESCURO
    return im


def centraliza(im):
    conteudo = im.crop(im.getbbox())
    out = Image.new("RGBA", (CELULA, CELULA))
    out.alpha_composite(conteudo, ((CELULA - conteudo.width) // 2, (CELULA - conteudo.height) // 2))
    return out


def sem_flor(piso, base):
    """Ponto colorido na area jogavel parece power-up: a flor vira grama."""
    piso = piso.copy()
    px = piso.load()
    for y in range(CELULA):
        for x in range(CELULA):
            if px[x, y] == GRAMA_FLOR:
                px[x, y] = base
    return piso


def piso_escuro(claro):
    escuro = claro.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    px = escuro.load()
    for y in range(CELULA):
        for x in range(CELULA):
            if px[x, y] in (GRAMA_BASE, GRAMA_FLOR):
                px[x, y] = GRAMA_BASE_ESCURA
    return escuro


def salva(im, nome, destinos):
    for d in destinos:
        im.save(os.path.join(d, nome + ".png"), optimize=True)


if __name__ == "__main__":
    origem, *destinos = sys.argv[1:4]
    claro = Image.open(os.path.join(origem, "tiles/grass_floor/grass_light.png")).convert("RGBA")
    salva(sem_flor(claro, GRAMA_BASE), "piso-claro", destinos)
    salva(piso_escuro(claro), "piso-escuro", destinos)
    for nome, (rel, cores, contorno) in PECAS.items():
        im = binariza_alfa(Image.open(os.path.join(origem, rel)).convert("RGBA"))
        im = reduz_paleta(im, cores)
        im, trocas = limpa(im)
        if contorno:
            im = fecha_contorno(im)
        im = centraliza(im)
        salva(im, nome, destinos)
        print(f"{nome:20} conteudo {im.getbbox()} ruido limpo={trocas}")
