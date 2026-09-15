import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  comoAnonimo,
  comoDono,
  comoUsuario,
  criarProcesso,
  criarUsuario,
  emTransacao,
  esperarErro,
  vincular,
} from "./db";

describe("inscrição", () => {
  it("cadastro cria perfil pendente com os dados enviados", () =>
    emTransacao(async (db) => {
      const id = await criarUsuario(db, { nome: "Maria" });
      const { rows } = await db.query("select nome, matricula, semestre, papel, status, oab_numero from public.perfis where id = $1", [id]);
      expect(rows[0]).toEqual({ nome: "Maria", matricula: "2026001", semestre: "5º", papel: "aluno", status: "pendente", oab_numero: null });
    }));

  it("cadastro sem matrícula falha inteiro", () =>
    emTransacao(async (db) => {
      await comoDono(db);
      const erro = await esperarErro(db, "insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3)", [
        randomUUID(),
        "sem-matricula@teste.simproc.invalid",
        { nome: "X", semestre: "1º" },
      ]);
      expect(erro.code).toBe("23502");
    }));

  it("aluno lê só o próprio perfil", () =>
    emTransacao(async (db) => {
      const a = await criarUsuario(db);
      const b = await criarUsuario(db);
      await comoUsuario(db, a);
      const { rows } = await db.query("select id from public.perfis where id in ($1, $2)", [a, b]);
      expect(rows.map((r) => r.id)).toEqual([a]);
    }));

  it("aluno altera o nome, mas não status, papel nem OAB", () =>
    emTransacao(async (db) => {
      const a = await criarUsuario(db);
      await comoUsuario(db, a);
      const ok = await db.query("update public.perfis set nome = 'Novo Nome' where id = $1", [a]);
      expect(ok.rowCount).toBe(1);
      for (const sql of [
        "update public.perfis set status = 'aprovado' where id = $1",
        "update public.perfis set papel = 'admin' where id = $1",
        "update public.perfis set oab_numero = 1 where id = $1",
      ]) {
        const erro = await esperarErro(db, sql, [a]);
        expect(erro.code, sql).toBe("42501");
      }
    }));

  it("aluno não se aprova nem recusa ninguém", () =>
    emTransacao(async (db) => {
      const a = await criarUsuario(db);
      await comoUsuario(db, a);
      expect((await esperarErro(db, "select public.aprovar_inscricao($1)", [a])).code).toBe("42501");
      expect((await esperarErro(db, "select public.recusar_inscricao($1)", [a])).code).toBe("42501");
    }));

  it("admin aprova: gera OAB e mantém o número em nova aprovação", () =>
    emTransacao(async (db) => {
      const admin = await criarUsuario(db, { papel: "admin", status: "aprovado" });
      const a = await criarUsuario(db);
      await comoUsuario(db, admin);
      const primeira = await db.query("select (public.aprovar_inscricao($1)).*", [a]);
      expect(primeira.rows[0].status).toBe("aprovado");
      const numero = primeira.rows[0].oab_numero;
      expect(numero).toBeGreaterThan(0);

      await db.query("select public.recusar_inscricao($1)", [a]);
      const segunda = await db.query("select (public.aprovar_inscricao($1)).*", [a]);
      expect(segunda.rows[0].oab_numero).toBe(numero);
    }));

  it("recusar remove os vínculos do aluno", () =>
    emTransacao(async (db) => {
      const admin = await criarUsuario(db, { papel: "admin", status: "aprovado" });
      const a = await criarUsuario(db, { status: "aprovado" });
      const processo = await criarProcesso(db, 9_000_010);
      await vincular(db, processo, a);
      await comoUsuario(db, admin);
      await db.query("select public.recusar_inscricao($1)", [a]);
      const { rows } = await db.query("select count(*)::int as n from public.processo_advogados where advogado_id = $1", [a]);
      expect(rows[0].n).toBe(0);
    }));

  it("admin lê todos os perfis", () =>
    emTransacao(async (db) => {
      const admin = await criarUsuario(db, { papel: "admin", status: "aprovado" });
      const a = await criarUsuario(db);
      await comoUsuario(db, admin);
      const { rows } = await db.query("select id from public.perfis where id = $1", [a]);
      expect(rows).toHaveLength(1);
    }));

  it("anônimo não lê perfis", () =>
    emTransacao(async (db) => {
      await criarUsuario(db);
      await comoAnonimo(db);
      const erro = await esperarErro(db, "select id from public.perfis");
      expect(erro.code).toBe("42501");
    }));
});
