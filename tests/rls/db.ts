import { randomUUID } from "node:crypto";
import pg from "pg";

export type Db = pg.Client;

const SEQUENCIAS = ["public.oab_numero_seq", "public.processo_seq"];

// Roda o teste numa transação e desfaz tudo no fim.
// Sequências não voltam com rollback: o estado delas é guardado antes e
// restaurado depois (setval não é transacional), para os testes não
// consumirem números de OAB/processo reais.
export async function emTransacao(fn: (db: Db) => Promise<void>): Promise<void> {
  const url = process.env.SUPABASE_DB_URL;
  if (!url) throw new Error("Falta SUPABASE_DB_URL no .env.local");
  const db = new pg.Client({ connectionString: url });
  await db.connect();
  const estado = [];
  for (const seq of SEQUENCIAS) {
    const { rows } = await db.query(`select last_value, is_called from ${seq}`);
    estado.push({ seq, ...rows[0] });
  }
  try {
    await db.query("begin");
    await fn(db);
  } finally {
    await db.query("rollback").catch(() => {});
    for (const { seq, last_value, is_called } of estado) {
      await db.query("select setval($1, $2, $3)", [seq, last_value, is_called]);
    }
    await db.end();
  }
}

export async function comoUsuario(db: Db, id: string): Promise<void> {
  await db.query("reset role");
  await db.query("select set_config('request.jwt.claims', $1, true)", [
    JSON.stringify({ sub: id, role: "authenticated" }),
  ]);
  await db.query("set local role authenticated");
}

export async function comoAnonimo(db: Db): Promise<void> {
  await db.query("reset role");
  await db.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify({ role: "anon" })]);
  await db.query("set local role anon");
}

export async function comoDono(db: Db): Promise<void> {
  await db.query("reset role");
}

// Executa e devolve o erro do Postgres; falha o teste se não houver erro.
// Usa savepoint para a transação continuar utilizável depois do erro.
export async function esperarErro(db: Db, sql: string, params: unknown[] = []): Promise<{ code: string; message: string }> {
  await db.query("savepoint esperado");
  try {
    await db.query(sql, params);
  } catch (erro) {
    await db.query("rollback to savepoint esperado");
    return erro as { code: string; message: string };
  }
  await db.query("release savepoint esperado");
  throw new Error(`Esperava erro e não houve: ${sql}`);
}

type NovoUsuario = { nome?: string; papel?: "aluno" | "admin"; status?: "pendente" | "aprovado" | "recusado" };

// Cria usuário como faria o cadastro (o trigger cria o perfil) e ajusta
// papel/status diretamente como dono do banco.
export async function criarUsuario(db: Db, opcoes: NovoUsuario = {}): Promise<string> {
  const { nome = "Aluno Teste", papel = "aluno", status = "pendente" } = opcoes;
  const id = randomUUID();
  await comoDono(db);
  await db.query("insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3)", [
    id,
    `${id}@teste.simproc.invalid`,
    { nome, matricula: "2026001", semestre: "5º" },
  ]);
  if (papel !== "aluno" || status !== "pendente") {
    await db.query(
      `update public.perfis
          set papel = $2, status = $3,
              oab_numero = case when $2 = 'aluno' and $3 = 'aprovado' then nextval('public.oab_numero_seq') end
        where id = $1`,
      [id, papel, status],
    );
  }
  return id;
}

export async function criarProcesso(db: Db, sequencial: number): Promise<string> {
  await comoDono(db);
  const numero = `${String(sequencial).padStart(7, "0")}-00.2026.8.99.0001`;
  const { rows } = await db.query(
    `insert into public.processos (numero, classe, juizo, reu, imputacao)
     values ($1, 'Ação Penal', '1ª Vara Criminal', 'Réu Fictício', 'art. 155 do CP') returning id`,
    [numero],
  );
  return rows[0].id;
}

export async function vincular(db: Db, processoId: string, advogadoId: string): Promise<void> {
  await comoDono(db);
  await db.query("insert into public.processo_advogados (processo_id, advogado_id) values ($1, $2)", [
    processoId,
    advogadoId,
  ]);
}

export async function criarMovimentacao(db: Db, processoId: string, autorId: string): Promise<string> {
  await comoDono(db);
  const { rows } = await db.query(
    `insert into public.movimentacoes (processo_id, tipo, data, texto, criado_por)
     values ($1, 'despacho', '2026-09-15', 'Cite-se.', $2) returning id`,
    [processoId, autorId],
  );
  return rows[0].id;
}

// Cenário padrão: admin, dois alunos em processos diferentes e um pendente.
export async function cenario(db: Db) {
  const admin = await criarUsuario(db, { nome: "Admin", papel: "admin", status: "aprovado" });
  const alunoA = await criarUsuario(db, { nome: "Aluno A", status: "aprovado" });
  const alunoB = await criarUsuario(db, { nome: "Aluno B", status: "aprovado" });
  const pendente = await criarUsuario(db, { nome: "Pendente" });
  const processoA = await criarProcesso(db, 9_000_001);
  const processoB = await criarProcesso(db, 9_000_002);
  await vincular(db, processoA, alunoA);
  await vincular(db, processoB, alunoB);
  const movA = await criarMovimentacao(db, processoA, admin);
  const movB = await criarMovimentacao(db, processoB, admin);
  return { admin, alunoA, alunoB, pendente, processoA, processoB, movA, movB };
}
