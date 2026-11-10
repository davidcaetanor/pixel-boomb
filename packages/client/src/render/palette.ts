/** Cor de cada slot de jogador, usada no marcador de spawn, no placar e na seta. */
export const CORES_JOGADOR: readonly number[] = [
  0xe85d5d, 0x5da9e8, 0x6fcf63, 0xe8d15d,
  0xb46fe8, 0xe8945d, 0x5de8c9, 0xe85db4,
];

const COR_PADRAO = 0xffffff;

export function corDoSlot(slot: number): number {
  return CORES_JOGADOR[slot % CORES_JOGADOR.length] ?? COR_PADRAO;
}

export function corCss(cor: number): string {
  return `#${cor.toString(16).padStart(6, "0")}`;
}
