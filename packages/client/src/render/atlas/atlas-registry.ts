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

/**
 * Folha do jogador, montada a partir de assets/source/characters/bender:
 * uma linha por direcao (ordem de DIRECOES_FOLHA), coluna 0 = parado
 * (rotacao 32x32 centralizada), colunas 1..6 = frames de caminhada.
 * Frames de 48x48 com o personagem na mesma escala do tile de 32.
 */
export const FOLHA_JOGADOR = {
  chave: "jogador-provisorio",
  larguraFrame: 48,
  alturaFrame: 48,
  colunas: 7,
  framesCaminhada: 6,
} as const;

export const DIRECOES_FOLHA = ["south", "west", "east", "north"] as const;
export type DirecaoFolha = (typeof DIRECOES_FOLHA)[number];

export function caminhoDaFolha(chave: string): string {
  return `/${chave}.png`;
}
