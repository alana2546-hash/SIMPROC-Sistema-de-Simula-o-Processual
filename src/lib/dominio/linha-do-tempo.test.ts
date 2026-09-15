import { describe, expect, it } from "vitest";
import {
  agruparPorMes,
  atoDaDecisao,
  contarPorTipo,
  formatarDataExtenso,
  formatarTamanho,
  numerarEventos,
  ordenarRecentes,
  primeiraFrase,
  ultimaDecisao,
} from "./linha-do-tempo";

const mov = (id: string, tipo: string, data: string, publicada_em: string, texto = "x") => ({ id, tipo, data, publicada_em, texto });

// Publicadas fora de ordem de propósito: a data da simulação manda, e a hora
// de publicação só desempata movimentações do mesmo dia.
const MOVS = [
  mov("int", "intimacao", "2026-09-15", "2026-09-15T17:00:09Z"),
  mov("dec1", "decisao", "2026-06-16", "2026-09-15T17:00:03Z", "Decretada a prisão temporária de três investigados. Expeçam-se mandados."),
  mov("jun1", "juntada", "2026-06-12", "2026-09-15T17:00:01Z"),
  mov("jun2", "juntada", "2026-06-12", "2026-09-15T17:00:02Z"),
  mov("dec3", "decisao", "2026-08-14", "2026-09-15T17:00:08Z", "Decretada a prisão preventiva."),
  mov("jun3", "juntada", "2026-08-14", "2026-09-15T17:00:07Z"),
];

describe("numerarEventos", () => {
  it("numera em ordem cronológica, desempatando pela publicação", () => {
    expect(numerarEventos(MOVS)).toEqual({ jun1: 1, jun2: 2, dec1: 3, jun3: 4, dec3: 5, int: 6 });
  });
});

describe("ordenarRecentes", () => {
  it("mais recente primeiro, inclusive no mesmo dia", () => {
    expect(ordenarRecentes(MOVS).map((m) => m.id)).toEqual(["int", "dec3", "jun3", "dec1", "jun2", "jun1"]);
  });

  it("não altera a lista original", () => {
    const copia = [...MOVS];
    ordenarRecentes(MOVS);
    expect(MOVS).toEqual(copia);
  });
});

describe("agruparPorMes", () => {
  it("agrupa preservando a ordem recebida e nomeia o mês por extenso", () => {
    const grupos = agruparPorMes(ordenarRecentes(MOVS));
    expect(grupos.map((g) => [g.rotulo, g.itens.map((m) => m.id)])).toEqual([
      ["Setembro de 2026", ["int"]],
      ["Agosto de 2026", ["dec3", "jun3"]],
      ["Junho de 2026", ["dec1", "jun2", "jun1"]],
    ]);
  });
});

describe("ultimaDecisao", () => {
  it("devolve a decisão mais recente", () => {
    expect(ultimaDecisao(MOVS)?.id).toBe("dec3");
  });

  it("devolve null sem decisão", () => {
    expect(ultimaDecisao([mov("a", "juntada", "2026-01-01", "2026-01-01T00:00:00Z")])).toBeNull();
  });
});

describe("primeiraFrase", () => {
  it("corta na primeira frase", () => {
    expect(primeiraFrase("Decretada a prisão temporária de três investigados. Expeçam-se mandados.")).toBe(
      "Decretada a prisão temporária de três investigados",
    );
  });

  it("limita o tamanho sem cortar palavra ao meio", () => {
    expect(primeiraFrase("Deferido o pedido e prorrogada a prisão temporária de duas pessoas investigadas", 40)).toBe(
      "Deferido o pedido e prorrogada a prisão…",
    );
  });
});

describe("atoDaDecisao", () => {
  it("fica só com o ato, sem a lista de nomes", () => {
    expect(atoDaDecisao("Decretada a prisão preventiva de Renato Barreto de Lima, Caroline Moura Braga e Emerson Cunha da Luz. Expeçam-se mandados.")).toBe(
      "Decretada a prisão preventiva",
    );
    expect(atoDaDecisao("Deferido o pedido e prorrogada a prisão temporária de Caroline Moura Braga e Renato Barreto de Lima pelo prazo de 30 dias.")).toBe(
      "Deferido o pedido e prorrogada a prisão temporária",
    );
  });

  it("sem nome próprio, usa a primeira frase", () => {
    expect(atoDaDecisao("Recebida a denúncia. Cite-se.")).toBe("Recebida a denúncia");
  });
});

describe("contarPorTipo", () => {
  it("conta cada tipo", () => {
    expect(contarPorTipo(MOVS)).toEqual({ intimacao: 1, decisao: 2, juntada: 3 });
  });
});

describe("formatarDataExtenso", () => {
  it("escreve dia e mês por extenso", () => {
    expect(formatarDataExtenso("2026-08-14")).toBe("14 de agosto de 2026");
    expect(formatarDataExtenso("2026-08-14", { comAno: false })).toBe("14 de agosto");
    expect(formatarDataExtenso("2026-09-01")).toBe("1º de setembro de 2026");
  });
});

describe("formatarTamanho", () => {
  it("usa KB até 1 MB e MB com vírgula acima", () => {
    expect(formatarTamanho(500)).toBe("1 KB");
    expect(formatarTamanho(230945)).toBe("226 KB");
    expect(formatarTamanho(2701741)).toBe("2,6 MB");
  });
});
