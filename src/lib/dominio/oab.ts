export function formatarOab(numero: number): string {
  if (!Number.isInteger(numero) || numero < 1) {
    throw new RangeError(`número OAB inválido: ${numero}`);
  }
  return `OAB/SIMPROC ${String(numero).padStart(4, "0")}`;
}
