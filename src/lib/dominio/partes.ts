// Investigados do processo, lidos do campo "Réu" ("A, B e C"). É a lista de
// clientes possíveis dos advogados constituídos.
export function investigadosDoProcesso(reu: string): string[] {
  const nomes = reu
    .split(/,|\s+e\s+/)
    .map((p) => p.trim())
    .filter(Boolean);
  return [...new Set(nomes)];
}

// O cliente só vale se ainda consta entre os investigados (o campo "Réu" pode
// ter sido editado depois do vínculo).
export function clienteDefinido(cliente: string | null, investigados: string[]): string | null {
  return cliente && investigados.includes(cliente) ? cliente : null;
}

// Advogados por cliente, na ordem dos investigados (investigado sem advogado
// também aparece). Vários advogados podem defender o mesmo cliente. Quem está
// sem cliente válido fica em semCliente, para a coordenação definir.
export function agruparPorCliente<T extends { cliente: string | null }>(advogados: T[], investigados: string[]) {
  const grupos = investigados.map((cliente) => ({
    cliente,
    advogados: advogados.filter((a) => a.cliente === cliente),
  }));
  const semCliente = advogados.filter((a) => clienteDefinido(a.cliente, investigados) === null);
  return { grupos, semCliente };
}
