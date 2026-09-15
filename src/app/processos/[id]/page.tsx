import Link from "next/link";
import { notFound } from "next/navigation";
import { Cabecalho } from "@/components/Cabecalho";
import { CabecalhoProcesso } from "@/components/processo/CabecalhoProcesso";
import { CartaoMovimentacao } from "@/components/processo/CartaoMovimentacao";
import { PrazosEmAberto } from "@/components/processo/PrazosEmAberto";
import { exigirAdvogado } from "@/lib/auth/sessao";
import { dataEmBrasilia } from "@/lib/dominio/datas";
import { ehNova } from "@/lib/dominio/novidades";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import type { Movimentacao, Processo } from "@/lib/tipos";

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
      .select("id, tipo, data, texto, prazo_final, publicada_em, anexos(id, nome_arquivo, tamanho_bytes)")
      .eq("processo_id", id)
      .order("data", { ascending: false })
      .order("publicada_em", { ascending: false }),
  ]);
  if (!processo) notFound();

  const movs = (movimentacoes ?? []) as Movimentacao[];
  const ultimoAcesso = (anterior as string | null) ?? null;
  const hoje = dataEmBrasilia(new Date());

  return (
    <>
      <Cabecalho perfil={perfil} inicio="/painel" />
      <main className="mx-auto grid w-full max-w-4xl gap-4 px-4 py-6">
        <Link href="/painel" className="text-sm text-[#1d2b45] underline">
          ← Meus processos
        </Link>
        <CabecalhoProcesso processo={processo as Processo} advogados={advogados ?? []} />
        <PrazosEmAberto movimentacoes={movs} hoje={hoje} />
        <section className="grid gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-600">Movimentações</h2>
          {movs.length === 0 ? (
            <p className="rounded-lg border border-neutral-200 bg-white p-4 text-neutral-700">
              Nenhuma movimentação até o momento.
            </p>
          ) : (
            movs.map((m) => (
              <CartaoMovimentacao key={m.id} movimentacao={m} nova={ehNova(m.publicada_em, ultimoAcesso)} />
            ))
          )}
        </section>
      </main>
    </>
  );
}
