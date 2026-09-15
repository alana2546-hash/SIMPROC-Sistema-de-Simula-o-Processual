import { describe, expect, it } from "vitest";
import { formatarOab } from "./oab";

describe("formatarOab", () => {
  it("completa com zeros até 4 dígitos", () => {
    expect(formatarOab(1)).toBe("OAB/SIMPROC 0001");
    expect(formatarOab(42)).toBe("OAB/SIMPROC 0042");
    expect(formatarOab(9999)).toBe("OAB/SIMPROC 9999");
  });

  it("a partir de 10000 não corta nem completa", () => {
    expect(formatarOab(10000)).toBe("OAB/SIMPROC 10000");
  });

  it("recusa número inválido", () => {
    expect(() => formatarOab(0)).toThrow(RangeError);
    expect(() => formatarOab(-1)).toThrow(RangeError);
    expect(() => formatarOab(1.5)).toThrow(RangeError);
  });
});
