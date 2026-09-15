// Número de processo no padrão CNJ (Res. 65/2008): NNNNNNN-DD.AAAA.J.TR.OOOO.
// O SIMPROC usa J=8 e TR=99, um tribunal que não existe, para nunca colidir
// com processo real.
const J = "8";
const TR = "99";
const ORIGEM = "0001";
const MOD = BigInt(97);

function digitoVerificador(sequencial: string, ano: string): string {
  const base = BigInt(sequencial + ano + J + TR + ORIGEM) * BigInt(100);
  return String(BigInt(98) - (base % MOD)).padStart(2, "0");
}

export function numeroCnjFicticio(sequencial: number, ano: number): string {
  if (!Number.isInteger(sequencial) || sequencial < 1 || sequencial > 9_999_999) {
    throw new RangeError(`sequencial fora de 1..9999999: ${sequencial}`);
  }
  if (!Number.isInteger(ano) || ano < 1000 || ano > 9999) {
    throw new RangeError(`ano inválido: ${ano}`);
  }
  const n = String(sequencial).padStart(7, "0");
  const a = String(ano);
  return `${n}-${digitoVerificador(n, a)}.${a}.${J}.${TR}.${ORIGEM}`;
}

export function validarCnj(numero: string): boolean {
  const m = /^(\d{7})-(\d{2})\.(\d{4})\.(\d)\.(\d{2})\.(\d{4})$/.exec(numero);
  if (!m) return false;
  const [, n, dd, a, j, tr, o] = m;
  return BigInt(n + a + j + tr + o + dd) % MOD === BigInt(1);
}
