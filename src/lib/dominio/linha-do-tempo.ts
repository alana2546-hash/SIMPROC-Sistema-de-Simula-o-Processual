// Regras de apresentação da linha do tempo do processo. A "data" é a da
// simulação (escolhida pelo admin); a hora real de publicação só desempata
// movimentações do mesmo dia.

type Base = { id: string; tipo: string; data: string; publicada_em: string; texto: string };

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

function comparar(a: Base, b: Base): number {
  return a.data.localeCompare(b.data) || Date.parse(a.publicada_em) - Date.parse(b.publicada_em);
}

export function ordenarRecentes<T extends Base>(movimentacoes: T[]): T[] {
  return [...movimentacoes].sort((a, b) => comparar(b, a));
}

// Número do evento, como no eproc: 1 é o ato mais antigo.
export function numerarEventos(movimentacoes: Base[]): Record<string, number> {
  return Object.fromEntries([...movimentacoes].sort(comparar).map((m, i) => [m.id, i + 1]));
}

export function agruparPorMes<T extends Base>(movimentacoes: T[]): Array<{ chave: string; rotulo: string; itens: T[] }> {
  const grupos: Array<{ chave: string; rotulo: string; itens: T[] }> = [];
  for (const m of movimentacoes) {
    const chave = m.data.slice(0, 7);
    let grupo = grupos.at(-1);
    if (!grupo || grupo.chave !== chave) {
      const [ano, mes] = chave.split("-");
      const nome = MESES[Number(mes) - 1];
      grupo = { chave, rotulo: `${nome[0].toUpperCase()}${nome.slice(1)} de ${ano}`, itens: [] };
      grupos.push(grupo);
    }
    grupo.itens.push(m);
  }
  return grupos;
}

export function ultimaDecisao<T extends Base>(movimentacoes: T[]): T | null {
  return ordenarRecentes(movimentacoes).find((m) => m.tipo === "decisao") ?? null;
}

export function primeiraFrase(texto: string, maximo = 90): string {
  const frase = texto.trim().split(/(?<=[a-zà-ú0-9)])\.\s/i)[0].replace(/\.$/, "");
  if (frase.length <= maximo) return frase;
  const corte = frase.slice(0, maximo);
  return `${corte.slice(0, corte.lastIndexOf(" "))}…`;
}

// Resumo para o carimbo da capa: o ato decidido, sem a lista de pessoas
// ("Decretada a prisão preventiva de Fulano, ..." -> "Decretada a prisão preventiva").
export function atoDaDecisao(texto: string): string {
  const frase = primeiraFrase(texto, 200);
  const ato = /^(.+?)\s+d(?:e|o|a|os|as)\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ][a-záéíóúâêôãõç]+/.exec(frase)?.[1];
  return primeiraFrase(ato ?? frase, 64);
}

export function contarPorTipo(movimentacoes: Base[]): Record<string, number> {
  const contagem: Record<string, number> = {};
  for (const m of movimentacoes) contagem[m.tipo] = (contagem[m.tipo] ?? 0) + 1;
  return contagem;
}

export function formatarDataExtenso(data: string, { comAno = true } = {}): string {
  const [ano, mes, dia] = data.split("-").map(Number);
  const d = dia === 1 ? "1º" : String(dia);
  return `${d} de ${MESES[mes - 1]}${comAno ? ` de ${ano}` : ""}`;
}

export function formatarTamanho(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
}
