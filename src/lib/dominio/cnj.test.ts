import { describe, expect, it } from "vitest";
import { numeroCnjFicticio, validarCnj } from "./cnj";

// A fórmula (Res. CNJ 65/2008, módulo 97 base 10) foi conferida em 2026-09-15
// contra 9 números reais distintos, localmente. Números reais não entram aqui
// (repositório público); os vetores abaixo são fictícios (tribunal 8.99).
const VETORES: Array<[number, number, string]> = [
  [1, 2026, "0000001-43.2026.8.99.0001"],
  [42, 2026, "0000042-10.2026.8.99.0001"],
  [1234567, 2026, "1234567-17.2026.8.99.0001"],
  [42, 2027, "0000042-73.2027.8.99.0001"],
  [9999999, 2026, "9999999-97.2026.8.99.0001"],
];

describe("numeroCnjFicticio", () => {
  it.each(VETORES)("sequencial %i em %i gera %s", (seq, ano, esperado) => {
    expect(numeroCnjFicticio(seq, ano)).toBe(esperado);
  });

  it("recusa sequencial fora de 1..9999999", () => {
    expect(() => numeroCnjFicticio(0, 2026)).toThrow(RangeError);
    expect(() => numeroCnjFicticio(10_000_000, 2026)).toThrow(RangeError);
    expect(() => numeroCnjFicticio(1.5, 2026)).toThrow(RangeError);
  });

  it("recusa ano sem 4 dígitos", () => {
    expect(() => numeroCnjFicticio(1, 999)).toThrow(RangeError);
  });
});

describe("validarCnj", () => {
  it.each(VETORES)("aceita o número gerado (%i, %i)", (_s, _a, numero) => {
    expect(validarCnj(numero)).toBe(true);
  });

  it("recusa qualquer troca de um único dígito", () => {
    const numero = "0000042-10.2026.8.99.0001";
    for (let i = 0; i < numero.length; i++) {
      const c = numero[i];
      if (!/\d/.test(c)) continue;
      const trocado = numero.slice(0, i) + ((Number(c) + 1) % 10) + numero.slice(i + 1);
      expect(validarCnj(trocado), trocado).toBe(false);
    }
  });

  it("recusa formato inválido", () => {
    expect(validarCnj("00000421020268990001")).toBe(false);
    expect(validarCnj("")).toBe(false);
  });
});
