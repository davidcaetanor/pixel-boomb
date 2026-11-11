"""
Monta a folha de cada personagem a partir de assets/source/characters.

Linhas: south, west, east, north. Colunas: 0 parado (rotacao), depois os
quadros da caminhada e, por ultimo, o quadro de respiracao.

A respiracao e derivada do quadro parado, sem geracao: o tronco desce 1 px e as
pernas ficam onde estao. Usa os pixels do proprio personagem, entao a
identidade fica intacta (a versao gerada no PixelLab perdia detalhes, como o
musgo do Golem).

Cada direcao e alinhada pelo quadro parado: centro horizontal em CENTRO_X e pes
em LINHA_DOS_PES, deslocando todos os quadros daquela direcao pelo mesmo valor.
Assim nenhum personagem pula ao virar, todos pisam na mesma linha e o balanco
proprio da animacao fica intacto.
Uso: python monta_folhas.py <assets/source/characters> <pasta_atlas>
"""
import glob
import os
import sys

from PIL import Image

QUADRO = 48
CENTRO_X = 24
LINHA_DOS_PES = 39
DIRECOES = ("south", "west", "east", "north")
ELENCO = ("bender", "cogu", "gamabunta", "golem", "karasuno", "octus", "papyrus", "tommy")
QUADROS_CAMINHADA = 6
# Linhas acima dos pes que ficam paradas na respiracao (as pernas).
ALTURA_PERNAS = 5


def no_quadro(im):
    """Centraliza um quadro menor (a rotacao de 32) no quadro de 48."""
    if im.size == (QUADRO, QUADRO):
        return im
    out = Image.new("RGBA", (QUADRO, QUADRO))
    out.alpha_composite(im, ((QUADRO - im.width) // 2, (QUADRO - im.height) // 2))
    return out


def quadros(pasta):
    return [no_quadro(Image.open(p).convert("RGBA")) for p in sorted(glob.glob(os.path.join(pasta, "*.png")))]


def caminhada(base, direcao):
    for nome in ("Walk", "Walking"):
        pasta = os.path.join(base, "animations", nome, direcao)
        if os.path.isdir(pasta):
            fs = quadros(pasta)
            if len(fs) != QUADROS_CAMINHADA:
                raise ValueError(f"{pasta}: {len(fs)} quadros, esperado {QUADROS_CAMINHADA}")
            return fs
    raise FileNotFoundError(f"{base}: sem caminhada para {direcao}")


def respiracao(parado):
    """Tronco 1 px abaixo, pernas fixas: o personagem 'expira' sem mudar de forma."""
    pes = parado.getbbox()[3]
    corte = pes - ALTURA_PERNAS
    out = Image.new("RGBA", parado.size)
    out.alpha_composite(parado.crop((0, 0, QUADRO, corte)), (0, 1))
    out.alpha_composite(parado.crop((0, corte, QUADRO, QUADRO)), (0, corte))
    return out


def desloca(im, dx, dy):
    out = Image.new("RGBA", im.size)
    out.alpha_composite(im, (dx, dy))
    return out


def monta(base):
    linhas = []
    for d in DIRECOES:
        parado = no_quadro(Image.open(os.path.join(base, "rotations", d + ".png")).convert("RGBA"))
        b = parado.getbbox()
        dx = CENTRO_X - round((b[0] + b[2]) / 2)
        dy = LINHA_DOS_PES - b[3]
        parado = desloca(parado, dx, dy)
        linhas.append([parado, *(desloca(q, dx, dy) for q in caminhada(base, d)), respiracao(parado)])
    colunas = len(linhas[0])
    folha = Image.new("RGBA", (colunas * QUADRO, len(DIRECOES) * QUADRO))
    for r, linha in enumerate(linhas):
        for c, q in enumerate(linha):
            folha.alpha_composite(q, (c * QUADRO, r * QUADRO))
    return folha


if __name__ == "__main__":
    origem, atlas = sys.argv[1:3]
    for nome in ELENCO:
        folha = monta(os.path.join(origem, nome))
        folha.save(os.path.join(atlas, f"personagem-{nome}.png"), optimize=True)
        print(f"{nome:10} {folha.size}")
