import Link from "next/link";
import { notFound } from "next/navigation";
import { Cabecalho } from "@/components/Cabecalho";
import { CapaProcesso } from "@/components/processo/CapaProcesso";
import { FaixaPrazos } from "@/components/processo/FaixaPrazos";
import { LinhaDoTempo } from "@/components/processo/LinhaDoTempo";
import { IndiceDocumentos, SecaoPartes } from "@/components/processo/PainelProcesso";
import { exigirAdvogado } from "@/lib/auth/sessao";
import { dataEmBrasilia } from "@/lib/dominio/datas";
import { numerarEventos, ordenarRecentes, ultimaDecisao } from "@/lib/dominio/linha-do-tempo";
import { ehNova } from "@/lib/dominio/novidades";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import type { Defensor, Movimentacao, Processo } from "@/lib/tipos";

export default async function PaginaProcesso({ params }: PageProps<"/processos/[id]">) {
  const perfil = await exigirAdvogado();
  const { id } = await params;
  const supabase = await criarClienteServidor();

  // Devolve o acesso anterior e já grava o de agora. Falha = não é advogado
  // deste processo (ou id inválido): 404, sem revelar se o processo existe.
  const { data: anterior, error } = await supabase.rpc("registrar_acesso", { p_processo: id });
  if (error) notFound();

  const [{ data: processo }, { data: advogados }, { data: movimentacoes }] = await Promise.all([
    supabase.from("processos").select("*").eq("id", id).maybeSingle(),
    supabase.rpc("advogados_do_processo", { p_processo: id }),
    supabase
      .from("movimentacoes")
      .select("id, tipo, data, texto, prazo_final, publicada_em, anexos(id, nome_arquivo, tamanho_bytes, ordem)")
      .eq("processo_id", id)
      .order("data", { ascending: false })
      .order("publicada_em", { ascending: false })
      .order("ordem", { referencedTable: "anexos" }),
  ]);
  if (!processo) notFound();

  const movs = ordenarRecentes((movimentacoes ?? []) as Movimentacao[]);
  const numeros = numerarEventos(movs);
  const decisao = ultimaDecisao(movs);
  const ultimoAcesso = (anterior as string | null) ?? null;
  const novas = movs.filter((m) => ehNova(m.publicada_em, ultimoAcesso)).map((m) => m.id);

  return (
    <>
      <Cabecalho perfil={perfil} inicio="/painel" />
      <main className="mx-auto grid w-full max-w-6xl gap-5 px-4 py-6 sm:py-8">
        <Link href="/painel" className="w-fit text-sm text-carimbo underline-offset-2 hover:underline">
          Voltar para meus processos
        </Link>
        <CapaProcesso
          processo={processo as Processo}
          totalMovimentacoes={movs.length}
          totalDocumentos={movs.reduce((n, m) => n + m.anexos.length, 0)}
          ultimaDecisao={decisao && { texto: decisao.texto, data: decisao.data, evento: numeros[decisao.id] }}
        />
        <FaixaPrazos movimentacoes={movs} numeros={numeros} hoje={dataEmBrasilia(new Date())} perspectiva="aluno" />

        <div className="mt-3 grid gap-10 lg:grid-cols-[minmax(0,1fr)_19rem]">
          <LinhaDoTempo movimentacoes={movs} numeros={numeros} novas={novas} />
          <aside className="grid content-start gap-7 border-t border-linha pt-7 lg:sticky lg:top-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
            <SecaoPartes processo={processo as Processo} advogados={(advogados ?? []) as Defensor[]} />
            <IndiceDocumentos movimentacoes={movs} numeros={numeros} />
          </aside>
        </div>
      </main>
    </>
  );
}
