import { describe, expect, it } from "vitest";
import { agruparPorCliente, clienteDefinido, investigadosDoProcesso } from "./partes";

describe("investigadosDoProcesso", () => {
  it("separa por vírgula e pelo último 'e'", () => {
    expect(investigadosDoProcesso("Caroline Moura Braga, Renato Barreto de Lima e Emerson Cunha da Luz")).toEqual([
      "Caroline Moura Braga",
      "Renato Barreto de Lima",
      "Emerson Cunha da Luz",
    ]);
  });

  it("um investigado só vira lista de um", () => {
    expect(investigadosDoProcesso("  João da Silva ")).toEqual(["João da Silva"]);
  });

  it("não separa 'e' dentro de palavra e ignora sobras e repetidos", () => {
    expect(investigadosDoProcesso("Emerson Cunha, , Renato e Emerson Cunha")).toEqual(["Emerson Cunha", "Renato"]);
  });
});

describe("clienteDefinido", () => {
  const investigados = ["Caroline", "Renato"];

  it("aceita só quem consta entre os investigados", () => {
    expect(clienteDefinido("Renato", investigados)).toBe("Renato");
    expect(clienteDefinido("Emerson", investigados)).toBeNull();
    expect(clienteDefinido(null, investigados)).toBeNull();
    expect(clienteDefinido("", investigados)).toBeNull();
  });
});

describe("agruparPorCliente", () => {
  const investigados = ["Caroline", "Renato", "Emerson"];
  const a = (nome: string, cliente: string | null) => ({ nome, cliente });

  it("mantém a ordem dos investigados, inclusive os sem advogado, e aceita vários por cliente", () => {
    const advogados = [a("Júlia", "Caroline"), a("Mateus", "Renato"), a("Vanessa", "Caroline"), a("Artur", "Caroline")];
    const { grupos, semCliente } = agruparPorCliente(advogados, investigados);
    expect(grupos.map((g) => [g.cliente, g.advogados.map((x) => x.nome)])).toEqual([
      ["Caroline", ["Júlia", "Vanessa", "Artur"]],
      ["Renato", ["Mateus"]],
      ["Emerson", []],
    ]);
    expect(semCliente).toEqual([]);
  });

  it("sem cliente ou com cliente que saiu do campo Réu vai para 'a definir'", () => {
    const { grupos, semCliente } = agruparPorCliente([a("Raina", null), a("Laiza", "Nome Antigo"), a("Ana", "Renato")], investigados);
    expect(semCliente.map((x) => x.nome)).toEqual(["Raina", "Laiza"]);
    expect(grupos.flatMap((g) => g.advogados).map((x) => x.nome)).toEqual(["Ana"]);
  });
});
