import { describe, expect, it } from "vitest";
import {
  dataEmBrasilia,
  formatarDataBr,
  prazosEmAberto,
  rotuloPrazo,
  statusPrazo,
} from "./datas";

describe("dataEmBrasilia", () => {
  it("usa a data de Brasília, não a UTC", () => {
    // 23h30 de 15/09 em Brasília = 02h30 UTC de 16/09
    expect(dataEmBrasilia(new Date("2026-09-16T02:30:00Z"))).toBe("2026-09-15");
    // 00h10 de 16/09 em Brasília = 03h10 UTC de 16/09
    expect(dataEmBrasilia(new Date("2026-09-16T03:10:00Z"))).toBe("2026-09-16");
  });
});

describe("statusPrazo", () => {
  const hoje = "2026-09-15";

  it("vence hoje", () => {
    expect(statusPrazo("2026-09-15", hoje)).toEqual({ tipo: "vence_hoje" });
  });

  it("a vencer em N dias", () => {
    expect(statusPrazo("2026-09-18", hoje)).toEqual({ tipo: "a_vencer", dias: 3 });
  });

  it("vencido há até 7 dias continua no bloco", () => {
    expect(statusPrazo("2026-09-14", hoje)).toEqual({ tipo: "vencido", dias: 1 });
    expect(statusPrazo("2026-09-08", hoje)).toEqual({ tipo: "vencido", dias: 7 });
  });

  it("vencido há mais de 7 dias sai do bloco", () => {
    expect(statusPrazo("2026-09-07", hoje)).toEqual({ tipo: "fora_do_bloco" });
  });

  it("atravessa virada de mês", () => {
    expect(statusPrazo("2026-10-01", "2026-09-30")).toEqual({ tipo: "a_vencer", dias: 1 });
  });
});

describe("rotuloPrazo", () => {
  it("escreve cada situação", () => {
    expect(rotuloPrazo({ tipo: "vence_hoje" })).toBe("Vence hoje");
    expect(rotuloPrazo({ tipo: "a_vencer", dias: 1 })).toBe("Vence amanhã");
    expect(rotuloPrazo({ tipo: "a_vencer", dias: 3 })).toBe("Vence em 3 dias");
    expect(rotuloPrazo({ tipo: "vencido", dias: 1 })).toBe("Venceu ontem");
    expect(rotuloPrazo({ tipo: "vencido", dias: 5 })).toBe("Venceu há 5 dias");
  });
});

describe("prazosEmAberto", () => {
  it("só intimações com prazo dentro do bloco, do mais próximo ao mais distante", () => {
    const movs = [
      { id: "a", tipo: "intimacao", prazo_final: "2026-09-20" },
      { id: "b", tipo: "despacho", prazo_final: null },
      { id: "c", tipo: "intimacao", prazo_final: "2026-09-01" },
      { id: "d", tipo: "intimacao", prazo_final: "2026-09-14" },
      { id: "e", tipo: "intimacao", prazo_final: null },
    ];
    expect(prazosEmAberto(movs, "2026-09-15").map((m) => m.id)).toEqual(["d", "a"]);
  });
});

describe("formatarDataBr", () => {
  it("converte AAAA-MM-DD em DD/MM/AAAA", () => {
    expect(formatarDataBr("2026-03-10")).toBe("10/03/2026");
  });
});
