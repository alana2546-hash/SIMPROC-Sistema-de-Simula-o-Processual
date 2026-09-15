// Aplica supabase/migrations/*.sql em ordem, cada arquivo numa transação,
// registrando o que já foi aplicado. Existe porque não há Docker nem psql
// nesta máquina. Uso: npm run db:push
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { config } from "dotenv";
import pg from "pg";

config({ path: ".env.local" });
const url = process.env.SUPABASE_DB_URL;
if (!url) {
  console.error("Falta SUPABASE_DB_URL no .env.local");
  process.exit(1);
}

const pasta = path.join("supabase", "migrations");
const arquivos = readdirSync(pasta).filter((f) => f.endsWith(".sql")).sort();

const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  await client.query(`
    create schema if not exists simproc_interno;
    revoke all on schema simproc_interno from public, anon, authenticated;
    create table if not exists simproc_interno.migracoes (
      arquivo text primary key,
      aplicada_em timestamptz not null default now()
    );
  `);
  const { rows } = await client.query("select arquivo from simproc_interno.migracoes");
  const aplicadas = new Set(rows.map((r) => r.arquivo));

  for (const arquivo of arquivos) {
    if (aplicadas.has(arquivo)) {
      console.log(`já aplicada  ${arquivo}`);
      continue;
    }
    const sql = readFileSync(path.join(pasta, arquivo), "utf8");
    await client.query("begin");
    try {
      await client.query(sql);
      await client.query("insert into simproc_interno.migracoes (arquivo) values ($1)", [arquivo]);
      await client.query("commit");
      console.log(`aplicada     ${arquivo}`);
    } catch (erro) {
      await client.query("rollback");
      console.error(`FALHOU       ${arquivo}: ${erro.message}`);
      process.exitCode = 1;
      break;
    }
  }
} finally {
  await client.end();
}
