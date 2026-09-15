// "Novo" = publicado depois do último acesso do advogado ao processo.
export function ehNova(publicadaEm: string, ultimoAcessoEm: string | null): boolean {
  if (ultimoAcessoEm === null) return true;
  return Date.parse(publicadaEm) > Date.parse(ultimoAcessoEm);
}

export function contarNovidades(
  movimentacoes: Array<{ publicada_em: string }>,
  ultimoAcessoEm: string | null,
): number {
  return movimentacoes.filter((m) => ehNova(m.publicada_em, ultimoAcessoEm)).length;
}
