"use client";

import { FileText } from "lucide-react";
import { useMemo, useState } from "react";
import { BotaoExcluir } from "@/app/admin/processos/[id]/BotaoExcluir";
import { VISUAL_TIPO, ORDEM_FILTROS } from "@/components/processo/tipos";
import type { TipoMovimentacao } from "@/lib/dominio/formularios";
import { agruparPorMes, contarPorTipo, formatarDataExtenso, formatarTamanho } from "@/lib/dominio/linha-do-tempo";
import type { Movimentacao } from "@/lib/tipos";

const LIMITE_TEXTO = 360;

export function LinhaDoTempo({
  movimentacoes,
  numeros,
  novas = [],
  processoIdAdmin,
}: {
  /** já em ordem: mais recente primeiro */
  movimentacoes: Movimentacao[];
  numeros: Record<string, number>;
  novas?: string[];
  /** presente só na tela do admin: mostra o excluir */
  processoIdAdmin?: string;
}) {
  const [filtro, setFiltro] = useState<"todas" | TipoMovimentacao>("todas");
  const contagem = useMemo(() => contarPorTipo(movimentacoes), [movimentacoes]);
  const visiveis = filtro === "todas" ? movimentacoes : movimentacoes.filter((m) => m.tipo === filtro);
  const grupos = agruparPorMes(visiveis);
  const setNovas = new Set(novas);
  const filtros = ORDEM_FILTROS.filter((t) => contagem[t]);

  return (
    <section aria-labelledby="titulo-movimentacoes" className="min-w-0">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="titulo-movimentacoes" className="font-serif text-2xl font-semibold">
          Movimentações
        </h2>
        {filtros.length > 1 && (
          <div role="group" aria-label="Filtrar movimentações por tipo" className="flex flex-wrap gap-1.5">
            {(["todas", ...filtros] as const).map((f) => {
              const ativo = filtro === f;
              const rotulo = f === "todas" ? "Todas" : VISUAL_TIPO[f].plural;
              const n = f === "todas" ? movimentacoes.length : contagem[f];
              return (
                <button
                  key={f}
                  type="button"
                  aria-pressed={ativo}
                  onClick={() => setFiltro(f)}
                  className={`rounded-full border px-3 py-1 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-carimbo ${
                    ativo ? "border-tinta bg-tinta text-white" : "border-linha bg-folha text-tinta hover:border-tinta/40"
                  }`}
                >
                  {rotulo} <span className={`tabular-nums ${ativo ? "text-white/70" : "text-tinta-suave"}`}>{n}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {grupos.length === 0 && (
        <p className="mt-6 rounded-xl border border-dashed border-linha bg-folha px-5 py-6 text-tinta-suave">
          {movimentacoes.length === 0 ? "Nenhuma movimentação publicada ainda." : "Nenhuma movimentação desse tipo."}
        </p>
      )}

      {grupos.map((grupo) => (
        <div key={grupo.chave} className="mt-7">
          <h3 className="sticky top-0 z-10 -mx-1 bg-papel/95 px-1 py-2 font-serif text-lg text-tinta-suave italic backdrop-blur-sm">
            {grupo.rotulo}
          </h3>
          <ol className="relative mt-2 before:absolute before:top-3 before:bottom-3 before:left-[3.125rem] before:w-px before:bg-linha sm:before:left-[4rem]">
            {grupo.itens.map((m) => (
              <Evento
                key={m.id}
                movimentacao={m}
                numero={numeros[m.id]}
                nova={setNovas.has(m.id)}
                processoIdAdmin={processoIdAdmin}
              />
            ))}
          </ol>
        </div>
      ))}
    </section>
  );
}

function Evento({
  movimentacao: m,
  numero,
  nova,
  processoIdAdmin,
}: {
  movimentacao: Movimentacao;
  numero: number;
  nova: boolean;
  processoIdAdmin?: string;
}) {
  const [aberto, setAberto] = useState(false);
  const visual = VISUAL_TIPO[m.tipo];
  const decisao = m.tipo === "decisao";
  // a intimação com prazo é o ato que pede ação: ganha folha própria, em lacre
  const comPrazo = m.tipo === "intimacao" && Boolean(m.prazo_final);
  const longo = m.texto.length > LIMITE_TEXTO;
  const texto = longo && !aberto ? `${m.texto.slice(0, LIMITE_TEXTO).replace(/\s+\S*$/, "")}…` : m.texto;

  return (
    <li className="relative grid grid-cols-[1.5rem_2.25rem_minmax(0,1fr)] gap-x-2 pb-7 last:pb-1 sm:grid-cols-[2rem_2.5rem_minmax(0,1fr)] sm:gap-x-3">
      <span className="pt-2.5 text-right font-serif text-sm text-tinta-suave tabular-nums" title={`Evento ${numero}`}>
        <span className="sr-only">Evento </span>
        {numero}
      </span>
      <span className={`z-[1] mt-1 grid size-9 place-items-center justify-self-center rounded-full ring-2 ${visual.no}`}>
        <visual.Icone className="size-4" aria-hidden />
      </span>

      <article
        className={
          decisao
            ? "rounded-xl border border-tinta/15 bg-folha p-4 sm:p-5"
            : comPrazo
              ? "rounded-xl border border-lacre/35 border-l-4 border-l-lacre bg-folha p-4 sm:p-5"
              : "pt-1.5"
        }
      >
        <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className={`font-semibold ${visual.texto}`}>{visual.rotulo}</span>
          <time dateTime={m.data} className="text-sm text-tinta-suave">
            {formatarDataExtenso(m.data, { comAno: false })}
          </time>
          {nova && <span className="rounded-full bg-lacre px-2 py-0.5 text-xs font-semibold text-white">Novo</span>}
          {processoIdAdmin && (
            <span className="ml-auto">
              <BotaoExcluir processoId={processoIdAdmin} movimentacaoId={m.id} />
            </span>
          )}
        </header>

        <p
          className={`mt-1.5 max-w-[68ch] whitespace-pre-wrap ${
            decisao ? "font-serif text-[1.075rem] leading-[1.65]" : "text-[15px] leading-relaxed text-tinta/90"
          }`}
        >
          {texto}
        </p>
        {longo && (
          <button
            type="button"
            onClick={() => setAberto(!aberto)}
            aria-expanded={aberto}
            className="mt-1 text-sm font-medium text-carimbo underline-offset-2 hover:underline"
          >
            {aberto ? "Mostrar menos" : "Ler o texto completo"}
          </button>
        )}

        {m.prazo_final && (
          <p className="mt-2 text-sm font-medium text-lacre">Prazo final: {formatarDataExtenso(m.prazo_final)}</p>
        )}

        {m.anexos.length > 0 && (
          <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {m.anexos.map((a, i) => (
              <li key={a.id}>
                <a
                  href={`/anexos/${a.id}`}
                  target="_blank"
                  rel="noopener"
                  className="flex h-full min-w-0 items-center gap-3 rounded-lg border border-linha bg-folha px-3 py-2.5 transition-colors hover:border-carimbo focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-carimbo"
                >
                  <FileText className="size-5 shrink-0 text-carimbo" aria-hidden />
                  <span className="min-w-0">
                    <span className="line-clamp-2 text-sm font-medium break-words">{a.nome_arquivo.replace(/\.pdf$/i, "")}</span>
                    <span className="block text-xs text-tinta-suave">
                      PDF, {formatarTamanho(a.tamanho_bytes)}
                      {i === 0 && m.anexos.length > 1 ? ", peça principal" : ""}
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </article>
    </li>
  );
}
