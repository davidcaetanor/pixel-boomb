"""
Processa as pecas geradas do kit de UI: recorta no conteudo e limpa pixels
orfaos de baixo contraste (ruido de geracao), preservando detalhes
intencionais como rebites e brilhos.
Uso: python processa_kit.py <assets/source/ui> <pasta_processed> <pasta_atlas>
"""
import os
import sys
from collections import Counter
from PIL import Image

PECAS = {
    "ui-painel": "kit/pixelboom_ui_kit/elements/dialog_panel.png",
    "ui-slot": "kit/pixelboom_ui_kit/elements/slot/slot.png",
    "ui-slot-hover": "kit/pixelboom_ui_kit/elements/slot/hover.png",
    "ui-slot-selecionado": "kit/pixelboom_ui_kit/elements/slot/selected.png",
    "ui-slot-ocupado": "kit/pixelboom_ui_kit/elements/slot/taken.png",
    "ui-banner": "kit/pixelboom_ui_kit/elements/result_banner.png",
    "ui-botao": "kit/pixelboom_ui_kit/elements/button/button.png",
    "ui-botao-hover": "kit/pixelboom_ui_kit/elements/button/hover.png",
    "ui-botao-pressionado": "kit/pixelboom_ui_kit/elements/button/pressed.png",
    "ui-botao-desabilitado": "kit/pixelboom_ui_kit/elements/button/disabled.png",
    "ui-coroa": "host_crown/host_crown.png",
}
# Diferenca de luminancia abaixo da qual um orfao e ruido, nao detalhe.
LIMIAR_RUIDO = 60
VIZINHOS = ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (-1, -1), (1, -1), (-1, 1))


def luminancia(c):
    return 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]


def limpa(im):
    w, h = im.size
    src = im.load()
    out = im.copy()
    dst = out.load()
    trocas = 0
    for y in range(h):
        for x in range(w):
            c = src[x, y]
            if c[3] == 0:
                continue
            viz = [src[x + dx, y + dy] for dx, dy in VIZINHOS if 0 <= x + dx < w and 0 <= y + dy < h]
            if c in viz:
                continue
            opacos = [v for v in viz if v[3] == 255]
            if not opacos:
                continue
            dominante, n = Counter(opacos).most_common(1)[0]
            if n >= 3 and abs(luminancia(dominante) - luminancia(c)) < LIMIAR_RUIDO:
                dst[x, y] = dominante
                trocas += 1
    return out, trocas


def binariza_alfa(im):
    """Alfa so 0 ou 255: nenhum pixel semitransparente."""
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            px[x, y] = (r, g, b, 255) if a >= 128 else (0, 0, 0, 0)
    return im


if __name__ == "__main__":
    origem, *destinos = sys.argv[1:4]
    for nome, rel in PECAS.items():
        im = binariza_alfa(Image.open(os.path.join(origem, rel)).convert("RGBA"))
        im = im.crop(im.getbbox())
        im, trocas = limpa(im)
        for d in destinos:
            im.save(os.path.join(d, nome + ".png"), optimize=True)
        print(f"{nome:24} {im.size} ruido limpo={trocas}")
