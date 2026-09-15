import Link from "next/link";
import { notFound } from "next/navigation";
import { desvincularAdvogado, editarProcesso, vincularAdvogado } from "@/app/admin/acoes";
import { FormProcesso } from "@/app/admin/processos/FormProcesso";
import { BotaoEnviar } from "@/components/BotaoEnviar";
import { CartaoMovimentacao } from "@/components/processo/CartaoMovimentacao";
import { dataEmBrasilia } from "@/lib/dominio/datas";
import { formatarOab } from "@/lib/dominio/oab";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import type { Movimentacao, Perfil, Processo } from "@/lib/tipos";
import { BotaoExcluir } from "./BotaoExcluir";
import { FormMovimentacao } from "./FormMovimentacao";

type Vinculo = { advogado_id: string; perfis: Pick<Perfil, "nome" | "oab_numero"> };

export default async function ProcessoAdmin({ params }: PageProps<"/admin/processos/[id]">) {
  const { id } = await params;
  const supabase = await criarClienteServidor();

  const { data: processo } = await supabase.from("processos").select("*").eq("id", id).maybeSingle();
  if (!processo) notFound();

  const [{ data: vinculos }, { data: aprovados }, { data: movimentacoes }] = await Promise.all([
    supabase.from("processo_advogados").select("advogado_id, perfis(nome, oab_numero)").eq("processo_id", id),
    supabase.from("perfis").select("id, nome, oab_numero").eq("papel", "aluno").eq("status", "aprovado").order("nome"),
    supabase
      .from("movimentacoes")
      .select("id, tipo, data, texto, prazo_final, publicada_em, anexos(id, nome_arquivo, tamanho_bytes)")
      .eq("processo_id", id)
      .order("data", { ascending: false })
      .order("publicada_em", { ascending: false }),
  ]);

  const constituidos = (vinculos ?? []) as unknown as Vinculo[];
  const idsConstituidos = new Set(constituidos.map((v) => v.advogado_id));
  const disponiveis = ((aprovados ?? []) as Array<Pick<Perfil, "id" | "nome" | "oab_numero">>).filter(
    (p) => !idsConstituidos.has(p.id),
  );
  const movs = (movimentacoes ?? []) as Movimentacao[];

  return (
    <>
      <Link href="/admin/processos" className="text-sm text-[#1d2b45] underline">
        ← Processos
      </Link>
      <h1 className="font-mono text-lg font-semibold break-all sm:text-xl">{(processo as Processo).numero}</h1>

      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="mb-3 font-medium">Dados do processo</h2>
        <FormProcesso acao={editarProcesso.bind(null, id)} processo={processo as Processo} rotulo="Salvar dados" />
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="mb-3 font-medium">Advogados constituídos</h2>
        {constituidos.length === 0 ? (
          <p className="text-sm text-neutral-600">Nenhum advogado constituído.</p>
        ) : (
          <ul className="mb-3 grid gap-2">
            {constituidos.map((v) => (
              <li key={v.advogado_id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span>
                  {v.perfis.nome}
                  {v.perfis.oab_numero ? ` (${formatarOab(v.perfis.oab_numero)})` : ""}
                </span>
                <form action={desvincularAdvogado.bind(null, id, v.advogado_id)}>
                  <BotaoEnviar variant="outline" enviando="Desvinculando…">
                    Desvincular
                  </BotaoEnviar>
                </form>
              </li>
            ))}
          </ul>
        )}
        {disponiveis.length > 0 ? (
          <form action={vincularAdvogado.bind(null, id)} className="mt-3 flex flex-wrap items-center gap-2">
            <select name="advogado_id" required className="h-8 min-w-0 flex-1 rounded-lg border border-input bg-transparent px-2.5 text-sm">
              {disponiveis.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                  {p.oab_numero ? ` — ${formatarOab(p.oab_numero)}` : ""}
                </option>
              ))}
            </select>
            <BotaoEnviar enviando="Constituindo…">Constituir</BotaoEnviar>
          </form>
        ) : (
          <p className="mt-3 text-xs text-neutral-500">Nenhum outro advogado aprovado disponível.</p>
        )}
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="mb-3 font-medium">Nova movimentação</h2>
        <FormMovimentacao processoId={id} hoje={dataEmBrasilia(new Date())} />
      </section>

      <section className="grid gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-600">Movimentações</h2>
        {movs.length === 0 ? (
          <p className="rounded-lg border border-neutral-200 bg-white p-4 text-neutral-700">Nenhuma movimentação.</p>
        ) : (
          movs.map((m) => (
            <CartaoMovimentacao
              key={m.id}
              movimentacao={m}
              acoes={<BotaoExcluir processoId={id} movimentacaoId={m.id} />}
            />
          ))
        )}
      </section>
    </>
  );
}
