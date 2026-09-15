import { describe, expect, it } from "vitest";
import { cenario, comoDono, comoUsuario, criarUsuario, emTransacao, esperarErro, vincular } from "./db";

describe("cliente do advogado constituído", () => {
  it("coordenação define e troca o cliente", () =>
    emTransacao(async (db) => {
      const c = await cenario(db);
      await comoUsuario(db, c.admin);
      for (const cliente of ["Réu Fictício", null]) {
        const r = await db.query(
          "update public.processo_advogados set cliente = $1 where processo_id = $2 and advogado_id = $3",
          [cliente, c.processoA, c.alunoA],
        );
        expect(r.rowCount).toBe(1);
        const { rows } = await db.query("select cliente from public.processo_advogados where advogado_id = $1", [c.alunoA]);
        expect(rows[0].cliente).toBe(cliente);
      }
    }));

  it("aluno não troca o próprio cliente nem o de colega", () =>
    emTransacao(async (db) => {
      const c = await cenario(db);
      const colega = await criarUsuario(db, { nome: "Colega", status: "aprovado" });
      await vincular(db, c.processoA, colega);

      await comoUsuario(db, c.alunoA);
      const r = await db.query("update public.processo_advogados set cliente = 'Réu Fictício' where processo_id = $1", [c.processoA]);
      expect(r.rowCount).toBe(0);

      await comoDono(db);
      const { rows } = await db.query("select cliente from public.processo_advogados where processo_id = $1", [c.processoA]);
      expect(rows.map((x) => x.cliente)).toEqual([null, null]);
    }));

  it("nem a coordenação muda processo ou advogado do vínculo por update", () =>
    emTransacao(async (db) => {
      const c = await cenario(db);
      await comoUsuario(db, c.admin);
      const erro = await esperarErro(db, "update public.processo_advogados set advogado_id = $1 where advogado_id = $2", [c.alunoB, c.alunoA]);
      expect(erro.code).toBe("42501");
    }));

  it("cliente vazio é recusado", () =>
    emTransacao(async (db) => {
      const c = await cenario(db);
      await comoUsuario(db, c.admin);
      const erro = await esperarErro(db, "update public.processo_advogados set cliente = '  ' where advogado_id = $1", [c.alunoA]);
      expect(erro.code).toBe("23514");
    }));

  it("aluno vê o cliente de cada advogado e só ele vem marcado como 'eu'", () =>
    emTransacao(async (db) => {
      const c = await cenario(db);
      const colega = await criarUsuario(db, { nome: "Colega", status: "aprovado" });
      await vincular(db, c.processoA, colega);
      await comoDono(db);
      await db.query("update public.processo_advogados set cliente = 'Réu Fictício' where advogado_id = $1", [c.alunoA]);

      await comoUsuario(db, c.alunoA);
      const { rows } = await db.query("select nome, cliente, eu from public.advogados_do_processo($1)", [c.processoA]);
      expect(rows).toEqual([
        { nome: "Aluno A", cliente: "Réu Fictício", eu: true },
        { nome: "Colega", cliente: null, eu: false },
      ]);

      // e continua sem ver nada do processo de outra equipe
      expect((await db.query("select * from public.advogados_do_processo($1)", [c.processoB])).rows).toHaveLength(0);
    }));
});
