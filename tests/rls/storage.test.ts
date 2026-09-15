import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { cenario, comoDono, comoUsuario, emTransacao, esperarErro, type Db } from "./db";

// Insere um objeto "falso" direto na tabela do Storage (sem arquivo real).
async function objeto(db: Db, nome: string, mimetype = "application/pdf", size = 1234) {
  await comoDono(db);
  await db.query("insert into storage.objects (bucket_id, name, metadata) values ('autos', $1, $2)", [
    nome,
    { size, mimetype },
  ]);
}

describe("storage dos autos", () => {
  it("caminho fora do formato não aponta processo", () =>
    emTransacao(async (db) => {
      const id = randomUUID();
      const casos: Array<[string, string | null]> = [
        [`processos/${id}/${randomUUID()}/a.pdf`, id],
        [`outra/${id}/${randomUUID()}/a.pdf`, null],
        [`processos/nao-e-uuid/${randomUUID()}/a.pdf`, null],
        [`processos/${id}/a.pdf`, null],
      ];
      for (const [nome, esperado] of casos) {
        const { rows } = await db.query("select public.processo_do_caminho($1) as p", [nome]);
        expect(rows[0].p, nome).toBe(esperado);
      }
    }));

  it("aluno lê objeto do próprio processo e não do processo de B", () =>
    emTransacao(async (db) => {
      const c = await cenario(db);
      const nomeA = `processos/${c.processoA}/${c.movA}/a.pdf`;
      const nomeB = `processos/${c.processoB}/${c.movB}/b.pdf`;
      await objeto(db, nomeA);
      await objeto(db, nomeB);

      await comoUsuario(db, c.alunoA);
      const { rows } = await db.query("select name from storage.objects where bucket_id = 'autos' and name in ($1, $2)", [nomeA, nomeB]);
      expect(rows.map((r) => r.name)).toEqual([nomeA]);

      await comoUsuario(db, c.pendente);
      expect((await db.query("select name from storage.objects where bucket_id = 'autos'")).rows).toHaveLength(0);
    }));

  it("aluno não grava nem apaga objeto", () =>
    emTransacao(async (db) => {
      const c = await cenario(db);
      const nomeA = `processos/${c.processoA}/${c.movA}/a.pdf`;
      await objeto(db, nomeA);

      await comoUsuario(db, c.alunoA);
      const erro = await esperarErro(db, "insert into storage.objects (bucket_id, name) values ('autos', $1)", [
        `processos/${c.processoA}/${c.movA}/novo.pdf`,
      ]);
      expect(erro.code).toBe("42501");

      await db.query("savepoint apagar");
      try {
        await db.query("delete from storage.objects where name = $1", [nomeA]);
      } catch {
        await db.query("rollback to savepoint apagar");
      }
      await comoDono(db);
      expect((await db.query("select 1 from storage.objects where name = $1", [nomeA])).rows).toHaveLength(1);
    }));

  it("publicar registra anexo com tamanho do Storage e recusa não-PDF ou acima de 20 MB", () =>
    emTransacao(async (db) => {
      const c = await cenario(db);
      const movId = randomUUID();
      const pasta = `processos/${c.processoA}/${movId}`;
      await objeto(db, `${pasta}/ok.pdf`, "application/pdf", 5000);
      await objeto(db, `${pasta}/img.png`, "image/png", 10);
      await objeto(db, `${pasta}/grande.pdf`, "application/pdf", 20 * 1024 * 1024 + 1);

      await comoUsuario(db, c.admin);
      const publicar = "select public.publicar_movimentacao($1, $2, 'decisao', '2026-09-15', 'Recebo a denúncia.', null, $3)";

      const png = await esperarErro(db, publicar, [movId, c.processoA, JSON.stringify([{ nome_arquivo: "img.png", caminho: `${pasta}/img.png` }])]);
      expect(png.code).toBe("22023");

      const grande = await esperarErro(db, publicar, [movId, c.processoA, JSON.stringify([{ nome_arquivo: "grande.pdf", caminho: `${pasta}/grande.pdf` }])]);
      expect(grande.code).toBe("23514");

      await db.query(publicar, [movId, c.processoA, JSON.stringify([{ nome_arquivo: "Denúncia.pdf", caminho: `${pasta}/ok.pdf`, tamanho_bytes: 1 }])]);
      const { rows } = await db.query("select nome_arquivo, tamanho_bytes from public.anexos where movimentacao_id = $1", [movId]);
      expect(rows).toEqual([{ nome_arquivo: "Denúncia.pdf", tamanho_bytes: 5000 }]);

      await comoUsuario(db, c.alunoA);
      expect((await db.query("select id from public.anexos where movimentacao_id = $1", [movId])).rows).toHaveLength(1);
      await comoUsuario(db, c.alunoB);
      expect((await db.query("select id from public.anexos where movimentacao_id = $1", [movId])).rows).toHaveLength(0);
    }));
});
