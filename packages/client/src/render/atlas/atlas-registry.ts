/**
 * Nomes de textura em um lugar so. Nenhuma cena escreve string de asset
 * solta: se um arquivo for renomeado, muda aqui e so aqui.
 *
 * O sufixo "-provisorio" e deliberado. Sao recortes derivados da saida crua
 * do PixelLab, feitos para destravar o render antes do pipeline de atlas
 * existir. Quando os tiles definitivos entrarem, os nomes perdem o sufixo e
 * este arquivo e o unico ponto de troca.
 */
export const TEXTURA = {
  piso: "piso-provisorio",
  pilar: "pilar-provisorio",
  caixa: "caixa-provisorio",
  arvore: "arvore-provisorio",
  arvorePequena: "arvore-p-provisorio",
  spawn: "spawn-provisorio",
  bomba: "bomba-provisorio",
} as const;

export type NomeTextura = (typeof TEXTURA)[keyof typeof TEXTURA];

/** Caminho servido para cada textura. publicDir aponta para assets/atlas. */
export function caminhoDaTextura(nome: NomeTextura): string {
  return `/${nome}.png`;
}

