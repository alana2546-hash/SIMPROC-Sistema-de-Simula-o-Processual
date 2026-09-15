import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { cenario, comoDono, comoUsuario, criarUsuario, emTransacao, esperarErro } from "./db";

describe("isolamento entre equipes", () => {
  it("aluno A não enxerga nada do processo de B", () =>
    emTransacao(async (db) => {
      const c = await cenario(db);
      await comoUsuario(db, c.alunoA);

      const processos = await db.query("select id from public.processos where id in ($1, $2)", [c.processoA, c.processoB]);
      expect(processos.rows.map((r) => r.id)).toEqual([c.processoA]);

      const movs = await db.query("select id from public.movimentacoes where id in ($1, $2)", [c.movA, c.movB]);
      expect(movs.rows.map((r) => r.id)).toEqual([c.movA]);

      const vinculos = await db.query("select processo_id from public.processo_advogados");
      expect(vinculos.rows.map((r) => r.processo_id)).toEqual([c.processoA]);

      const advogadosB = await db.query("select * from public.advogados_do_processo($1)", [c.processoB]);
      expect(advogadosB.rows).toHaveLength(0);
    }));

  it("aluno A não lê anexo nem acesso do processo de B", () =>
    emTransacao(async (db) => {
      const c = await cenario(db);
      await comoDono(db);
      await db.query(
        "insert into public.anexos (movimentacao_id, nome_arquivo, caminho, tamanho_bytes) values ($1, 'b.pdf', $2, 10)",
        [c.movB, `processos/${c.processoB}/${c.movB}/b.pdf`],
      );
      await db.query("insert into public.acessos (processo_id, advogado_id, ultimo_acesso_em) values ($1, $2, now())", [c.processoB, c.alunoB]);

      await comoUsuario(db, c.alunoA);
      expect((await db.query("select id from public.anexos")).rows).toHaveLength(0);
      expect((await db.query("select * from public.acessos")).rows).toHaveLength(0);
    }));

  it("pendente e recusado não leem nenhum processo, mesmo vinculados", () =>
    emTransacao(async (db) => {
      const c = await cenario(db);
      // aprovado vinculado que depois vira recusado direto no banco (sem a função)
      await comoDono(db);
      await db.query("update public.perfis set status = 'recusado' where id = $1", [c.alunoA]);
      for (const quem of [c.pendente, c.alunoA]) {
        await comoUsuario(db, quem);
        expect((await db.query("select id from public.processos")).rows, quem).toHaveLength(0);
        expect((await db.query("select id from public.movimentacoes")).rows, quem).toHaveLength(0);
      }
    }));

  it("aluno vê os advogados constituídos do próprio processo", () =>
    emTransacao(async (db) => {
      const c = await cenario(db);
      await comoUsuario(db, c.alunoA);
      const { rows } = await db.query("select nome, oab_numero from public.advogados_do_processo($1)", [c.processoA]);
      expect(rows).toHaveLength(1);
      expect(rows[0].nome).toBe("Aluno A");
      expect(rows[0].oab_numero).toBeGreaterThan(0);
    }));
});

describe("escrita", () => {
  it("aluno não cria, altera nem apaga processo, vínculo ou movimentação", () =>
    emTransacao(async (db) => {
      const c = await cenario(db);
      await comoUsuario(db, c.alunoA);

      const tentativas: Array<[string, unknown[]]> = [
        ["insert into public.processos (numero, classe, juizo, reu, imputacao) values ('0000001-43.2026.8.99.0001', 'a', 'b', 'c', 'd')", []],
        ["insert into public.processo_advogados (processo_id, advogado_id) values ($1, $2)", [c.processoB, c.alunoA]],
        ["insert into public.movimentacoes (processo_id, tipo, data, texto, criado_por) values ($1, 'despacho', '2026-09-15', 'x', $2)", [c.processoA, c.alunoA]],
        ["select public.publicar_movimentacao($1, $2, 'despacho', '2026-09-15', 'x', null, '[]')", [randomUUID(), c.processoA]],
        ["select public.proximo_sequencial_processo()", []],
      ];
      for (const [sql, params] of tentativas) {
        const erro = await esperarErro(db, sql, params);
        expect(erro.code, sql).toBe("42501");
      }

      const semEfeito = [
        ["update public.processos set reu = 'x' where id = $1", [c.processoA]],
        ["update public.movimentacoes set texto = 'x' where id = $1", [c.movA]],
        ["delete from public.movimentacoes where id = $1", [c.movA]],
        ["delete from public.processo_advogados where processo_id = $1", [c.processoA]],
      ] as const;
      for (const [sql, params] of semEfeito) {
        const r = await db.query(sql, [...params]);
        expect(r.rowCount, sql).toBe(0);
      }
    }));

  it("admin cria processo, vincula, publica, edita e apaga movimentação", () =>
    emTransacao(async (db) => {
      const c = await cenario(db);
      await comoUsuario(db, c.admin);

      const seq = await db.query("select public.proximo_sequencial_processo() as n");
      expect(seq.rows[0].n).toBeGreaterThan(0);

      const novo = await db.query(
        "insert into public.processos (numero, classe, juizo, reu, imputacao) values ('9000099-00.2026.8.99.0001', 'Ação Penal', '1ª Vara', 'Réu', 'art. 155') returning id",
      );
      const processo = novo.rows[0].id;
      await db.query("insert into public.processo_advogados (processo_id, advogado_id) values ($1, $2)", [processo, c.alunoB]);

      const movId = randomUUID();
      await db.query("select public.publicar_movimentacao($1, $2, 'intimacao', '2026-09-15', 'Intime-se.', '2026-09-20', '[]')", [movId, processo]);
      const upd = await db.query("update public.movimentacoes set texto = 'Intime-se a defesa.' where id = $1", [movId]);
      expect(upd.rowCount).toBe(1);

      const erroColuna = await esperarErro(db, "update public.movimentacoes set publicada_em = now() where id = $1", [movId]);
      expect(erroColuna.code).toBe("42501");

      const del = await db.query("delete from public.movimentacoes where id = $1", [movId]);
      expect(del.rowCount).toBe(1);
    }));

  it("vincular perfil não aprovado falha", () =>
    emTransacao(async (db) => {
      const c = await cenario(db);
      await comoUsuario(db, c.admin);
      const erro = await esperarErro(db, "insert into public.processo_advogados (processo_id, advogado_id) values ($1, $2)", [c.processoA, c.pendente]);
      expect(erro.code).toBe("23514");
    }));

  it("prazo final só em intimação", () =>
    emTransacao(async (db) => {
      const c = await cenario(db);
      await comoUsuario(db, c.admin);
      const erro = await esperarErro(db, "select public.publicar_movimentacao($1, $2, 'despacho', '2026-09-15', 'x', '2026-09-20', '[]')", [randomUUID(), c.processoA]);
      expect(erro.code).toBe("23514");
    }));

  it("anexo precisa estar na pasta da movimentação e existir no Storage", () =>
    emTransacao(async (db) => {
      const c = await cenario(db);
      await comoUsuario(db, c.admin);
      const movId = randomUUID();

      const fora = await esperarErro(db, "select public.publicar_movimentacao($1, $2, 'despacho', '2026-09-15', 'x', null, $3)", [
        movId,
        c.processoA,
        JSON.stringify([{ nome_arquivo: "a.pdf", caminho: `processos/${c.processoB}/${movId}/a.pdf` }]),
      ]);
      expect(fora.code).toBe("22023");

      const inexistente = await esperarErro(db, "select public.publicar_movimentacao($1, $2, 'despacho', '2026-09-15', 'x', null, $3)", [
        movId,
        c.processoA,
        JSON.stringify([{ nome_arquivo: "a.pdf", caminho: `processos/${c.processoA}/${movId}/a.pdf` }]),
      ]);
      expect(inexistente.code).toBe("P0002");
    }));
});

describe("acessos", () => {
  it("registrar_acesso devolve o anterior e só funciona para vinculado", () =>
    emTransacao(async (db) => {
      const c = await cenario(db);
      await comoUsuario(db, c.alunoA);
      const primeiro = await db.query("select public.registrar_acesso($1) as anterior", [c.processoA]);
      expect(primeiro.rows[0].anterior).toBeNull();
      const segundo = await db.query("select public.registrar_acesso($1) as anterior", [c.processoA]);
      expect(segundo.rows[0].anterior).not.toBeNull();

      const erro = await esperarErro(db, "select public.registrar_acesso($1)", [c.processoB]);
      expect(erro.code).toBe("42501");

      const direto = await esperarErro(db, "insert into public.acessos (processo_id, advogado_id, ultimo_acesso_em) values ($1, $2, now())", [c.processoB, c.alunoA]);
      expect(direto.code).toBe("42501");
    }));

  it("admin não usa registrar_acesso (não é advogado do processo)", () =>
    emTransacao(async (db) => {
      const c = await cenario(db);
      const outroAdmin = await criarUsuario(db, { papel: "admin", status: "aprovado" });
      await comoUsuario(db, outroAdmin);
      const erro = await esperarErro(db, "select public.registrar_acesso($1)", [c.processoA]);
      expect(erro.code).toBe("42501");
    }));
});
