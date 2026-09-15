import { describe, expect, it } from "vitest";
import { contarNovidades, ehNova } from "./novidades";

describe("ehNova", () => {
  it("sem acesso anterior, tudo é novo", () => {
    expect(ehNova("2026-09-01T10:00:00+00:00", null)).toBe(true);
  });

  it("publicada depois do último acesso é nova", () => {
    expect(ehNova("2026-09-15T12:00:00.5+00:00", "2026-09-15T12:00:00+00:00")).toBe(true);
  });

  it("publicada antes do último acesso não é nova", () => {
    expect(ehNova("2026-09-14T12:00:00+00:00", "2026-09-15T12:00:00+00:00")).toBe(false);
  });

  it("mesmo instante não é nova", () => {
    expect(ehNova("2026-09-15T12:00:00+00:00", "2026-09-15T09:00:00-03:00")).toBe(false);
  });
});

describe("contarNovidades", () => {
  it("conta só as publicadas depois do acesso", () => {
    const movs = [
      { publicada_em: "2026-09-10T00:00:00+00:00" },
      { publicada_em: "2026-09-16T00:00:00+00:00" },
      { publicada_em: "2026-09-17T00:00:00+00:00" },
    ];
    expect(contarNovidades(movs, "2026-09-15T00:00:00+00:00")).toBe(2);
    expect(contarNovidades(movs, null)).toBe(3);
  });
});
