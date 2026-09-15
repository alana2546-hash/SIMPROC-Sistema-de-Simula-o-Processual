import { describe, expect, it } from "vitest";
import {
  destinoSeguro,
  mensagemErroAuth,
  validarAnexo,
  validarCadastro,
  validarMovimentacao,
  validarProcesso,
} from "./formularios";

describe("validarCadastro", () => {
  const valido = {
    nome: " Maria Souza ",
    email: " Maria@Exemplo.com ",
    senha: "segredo123",
    matricula: "2026001",
    semestre: "5º",
  };

  it("aceita e normaliza", () => {
    expect(validarCadastro(valido)).toEqual({
      ok: true,
      dados: {
        nome: "Maria Souza",
        email: "maria@exemplo.com",
        senha: "segredo123",
        matricula: "2026001",
        semestre: "5º",
      },
    });
  });

  it("exige todos os campos", () => {
    for (const campo of ["nome", "email", "matricula", "semestre"] as const) {
      const r = validarCadastro({ ...valido, [campo]: "  " });
      expect(r.ok, campo).toBe(false);
    }
  });

  it("recusa e-mail sem @", () => {
    expect(validarCadastro({ ...valido, email: "maria" }).ok).toBe(false);
  });

  it("exige senha com pelo menos 8 caracteres", () => {
    expect(validarCadastro({ ...valido, senha: "1234567" })).toEqual({
      ok: false,
      erro: "A senha precisa ter pelo menos 8 caracteres.",
    });
  });

  it("ignora valores que não são texto", () => {
    expect(validarCadastro({ ...valido, nome: 123 }).ok).toBe(false);
  });
});

describe("validarProcesso", () => {
  it("exige classe, juízo, réu e imputação", () => {
    const valido = { classe: "Ação Penal", juizo: "1ª Vara", reu: "João", imputacao: "art. 155 do CP" };
    expect(validarProcesso(valido).ok).toBe(true);
    expect(validarProcesso({ ...valido, reu: "" }).ok).toBe(false);
  });
});

describe("validarMovimentacao", () => {
  const base = { tipo: "despacho", data: "2026-09-15", texto: "Cite-se.", prazo_final: "" };

  it("aceita movimentação simples sem prazo", () => {
    expect(validarMovimentacao(base)).toEqual({
      ok: true,
      dados: { tipo: "despacho", data: "2026-09-15", texto: "Cite-se.", prazo_final: null },
    });
  });

  it("descarta prazo se não for intimação", () => {
    const r = validarMovimentacao({ ...base, prazo_final: "2026-09-20" });
    expect(r.ok && r.dados.prazo_final).toBeNull();
  });

  it("mantém prazo em intimação", () => {
    const r = validarMovimentacao({ ...base, tipo: "intimacao", prazo_final: "2026-09-20" });
    expect(r.ok && r.dados.prazo_final).toBe("2026-09-20");
  });

  it("recusa tipo desconhecido, data inválida e texto vazio", () => {
    expect(validarMovimentacao({ ...base, tipo: "sentenca_x" }).ok).toBe(false);
    expect(validarMovimentacao({ ...base, data: "2026-02-30" }).ok).toBe(false);
    expect(validarMovimentacao({ ...base, texto: "   " }).ok).toBe(false);
    expect(validarMovimentacao({ ...base, tipo: "intimacao", prazo_final: "20/09/2026" }).ok).toBe(false);
  });
});

describe("validarAnexo", () => {
  it("aceita PDF até 20 MB", () => {
    expect(validarAnexo({ name: "denuncia.pdf", size: 20 * 1024 * 1024, type: "application/pdf" })).toBeNull();
  });

  it("recusa outro tipo ou tamanho maior", () => {
    expect(validarAnexo({ name: "foto.png", size: 10, type: "image/png" })).toBe(
      "“foto.png” não é PDF.",
    );
    expect(validarAnexo({ name: "grande.pdf", size: 20 * 1024 * 1024 + 1, type: "application/pdf" })).toBe(
      "“grande.pdf” passa de 20 MB.",
    );
  });
});

describe("destinoSeguro", () => {
  it("aceita caminho interno", () => {
    expect(destinoSeguro("/processos/abc?x=1")).toBe("/processos/abc?x=1");
  });

  it("recusa endereço externo ou vazio", () => {
    expect(destinoSeguro("https://mal.com")).toBe("/");
    expect(destinoSeguro("//mal.com")).toBe("/");
    expect(destinoSeguro("/\\mal.com")).toBe("/");
    expect(destinoSeguro(null)).toBe("/");
    expect(destinoSeguro("")).toBe("/");
  });
});

describe("mensagemErroAuth", () => {
  it("traduz os códigos conhecidos", () => {
    expect(mensagemErroAuth("user_already_exists")).toBe("Já existe inscrição com este e-mail.");
    expect(mensagemErroAuth("invalid_credentials")).toBe("E-mail ou senha incorretos.");
  });

  it("tem mensagem padrão", () => {
    expect(mensagemErroAuth(undefined)).toBe("Não foi possível concluir agora. Tente novamente.");
  });
});
