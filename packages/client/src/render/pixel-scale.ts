/**
 * Escala inteira em pixels de tela. Cada pixel de arte ocupa um numero inteiro
 * de pixels fisicos, inclusive com o Windows em 125% ou 150%; escala fracionaria
 * desenha pixels de larguras diferentes e a arte parece borrada.
 */
import { LOGICAL_HEIGHT, LOGICAL_WIDTH, RENDER_ZOOM } from "@pixelboom/shared";

/** Maior painel HTML (a sala com os 8 cards), em pixels de arte. */
const UI_LARGURA_ARTE = 340;
const UI_ALTURA_ARTE = 330;

function dpr(): number {
  return window.devicePixelRatio || 1;
}

/** Maior multiplo inteiro que cabe na janela, limitado ao zoom de projeto. */
function multiploQueCabe(largura: number, altura: number): number {
  const d = dpr();
  const alvo = Math.round(RENDER_ZOOM * d);
  if (window.innerWidth === 0 || window.innerHeight === 0) {
    return alvo;
  }
  const cabe = Math.floor(Math.min((window.innerWidth * d) / largura, (window.innerHeight * d) / altura));
  return Math.max(1, Math.min(cabe, alvo));
}

/** Zoom CSS do canvas: pixels fisicos inteiros por pixel de arte. */
export function zoomCss(): number {
  return multiploQueCabe(LOGICAL_WIDTH, LOGICAL_HEIGHT) / dpr();
}

/** Zoom CSS dos paineis HTML, que cabem em telas onde a arena nao cabe em 2x. */
export function zoomUi(): number {
  return multiploQueCabe(UI_LARGURA_ARTE, UI_ALTURA_ARTE) / dpr();
}

/**
 * Publica o zoom da UI em `--ui-zoom` e avisa o zoom do canvas a cada mudanca
 * de janela ou de escala do sistema.
 */
export function acompanhaEscala(aoMudar: (zoom: number) => void): void {
  const aplica = (): void => {
    document.documentElement.style.setProperty("--ui-zoom", String(zoomUi()));
    aoMudar(zoomCss());
  };
  window.addEventListener("resize", aplica);
  aplica();
}
