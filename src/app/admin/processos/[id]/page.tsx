import Link from "next/link";
import { notFound } from "next/navigation";
import { editarProcesso } from "@/app/admin/acoes";
import { FormProcesso } from "@/app/admin/processos/FormProcesso";
import { CapaProcesso } from "@/components/processo/CapaProcesso";
import { FaixaPrazos } from "@/components/processo/FaixaPrazos";
import { LinhaDoTempo } from "@/components/processo/LinhaDoTempo";
import { IndiceDocumentos } from "@/components/processo/PainelProcesso";
import { dataEmBrasilia } from "@/lib/dominio/datas";
import { numerarEventos, ordenarRecentes, ultimaDecisao } from "@/lib/dominio/linha-do-tempo";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import type { Movimentacao, Perfil, Processo } from "@/lib/tipos";
import { DefensoresAdmin, type VinculoAdmin } from "./DefensoresAdmin";
import { NovaMovimentacao } from "./NovaMovimentacao";

export default async function ProcessoAdmin({ params }: PageProps<"/admin/processos/[id]">) {
  const { id } = await params;
  const supabase = await criarClienteServidor();

  const { data: processo } = await supabase.from("processos").select("*").eq("id", id).maybeSingle();
  if (!processo) notFound();

  const [{ data: vinculos }, { data: aprovados }, { data: movimentacoes }] = await Promise.all([
    supabase.from("processo_advogados").select("advogado_id, cliente, perfis(nome, oab_numero)").eq("processo_id", id),
    supabase.from("perfis").select("id, nome, oab_numero").eq("papel", "aluno").eq("status", "aprovado").order("nome"),
    supabase
      .from("movimentacoes")
      .select("id, tipo, data, texto, prazo_final, publicada_em, anexos(id, nome_arquivo, tamanho_bytes, ordem)")
      .eq("processo_id", id)
      .order("data", { ascending: false })
      .order("publicada_em", { ascending: false })
      .order("ordem", { referencedTable: "anexos" }),
  ]);

  const constituidos = ((vinculos ?? []) as unknown as VinculoAdmin[]).sort((a, b) =>
    a.perfis.nome.localeCompare(b.perfis.nome, "pt-BR"),
  );
  const idsConstituidos = new Set(constituidos.map((v) => v.advogado_id));
  const disponiveis = ((aprovados ?? []) as Array<Pick<Perfil, "id" | "nome" | "oab_numero">>).filter(
    (p) => !idsConstituidos.has(p.id),
  );
  const movs = ordenarRecentes((movimentacoes ?? []) as Movimentacao[]);
  const numeros = numerarEventos(movs);
  const decisao = ultimaDecisao(movs);
  const hoje = dataEmBrasilia(new Date());

  return (
    <>
      <Link href="/admin/processos" className="w-fit text-sm text-carimbo underline-offset-2 hover:underline">
        Voltar para processos
      </Link>
      <CapaProcesso
        processo={processo as Processo}
        totalMovimentacoes={movs.length}
        totalDocumentos={movs.reduce((n, m) => n + m.anexos.length, 0)}
        ultimaDecisao={decisao && { texto: decisao.texto, data: decisao.data, evento: numeros[decisao.id] }}
      />
      <FaixaPrazos movimentacoes={movs} numeros={numeros} hoje={hoje} perspectiva="admin" />

      <div className="mt-3 grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="grid min-w-0 content-start gap-6">
          <NovaMovimentacao processoId={id} hoje={hoje} />
          <LinhaDoTempo movimentacoes={movs} numeros={numeros} processoIdAdmin={id} />
        </div>

        <aside className="grid content-start gap-7 border-t border-linha pt-7 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
          <DefensoresAdmin processoId={id} reu={(processo as Processo).reu} vinculos={constituidos} disponiveis={disponiveis} />

          <details className="group">
            <summary className="cursor-pointer list-none font-serif text-lg font-semibold marker:hidden">
              Dados do processo
              <span className="ml-2 font-sans text-sm font-normal text-carimbo group-open:hidden">editar</span>
            </summary>
            <div className="mt-3">
              <FormProcesso acao={editarProcesso.bind(null, id)} processo={processo as Processo} rotulo="Salvar dados" />
            </div>
          </details>

          <IndiceDocumentos movimentacoes={movs} numeros={numeros} />
        </aside>
      </div>
    </>
  );
}
