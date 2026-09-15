import { atoDaDecisao, formatarDataExtenso } from "@/lib/dominio/linha-do-tempo";
import type { Processo } from "@/lib/tipos";

// Capa dos autos. O carimbo com a última decisão é o único gesto ousado da
// página: diz de relance em que pé está o processo.
export function CapaProcesso({
  processo,
  totalMovimentacoes,
  totalDocumentos,
  ultimaDecisao,
}: {
  processo: Processo;
  totalMovimentacoes: number;
  totalDocumentos: number;
  ultimaDecisao: { texto: string; data: string; evento: number } | null;
}) {
  return (
    <section className="grid gap-6 rounded-2xl border border-linha bg-folha px-5 py-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-8 sm:py-8">
      <div className="min-w-0">
        <p className="text-sm text-tinta-suave">{processo.classe}</p>
        <h1 className="mt-1 font-serif text-[1.3rem] leading-tight font-semibold tracking-tight whitespace-nowrap tabular-nums min-[400px]:text-[1.45rem] sm:text-[2.35rem]">
          {processo.numero}
        </h1>
        <p className="mt-1.5 text-tinta-suave">{processo.juizo}</p>
        <dl className="mt-5 flex gap-8">
          <div>
            <dt className="text-sm text-tinta-suave">Movimentações</dt>
            <dd className="font-serif text-2xl tabular-nums">{totalMovimentacoes}</dd>
          </div>
          <div>
            <dt className="text-sm text-tinta-suave">Documentos</dt>
            <dd className="font-serif text-2xl tabular-nums">{totalDocumentos}</dd>
          </div>
        </dl>
      </div>

      {ultimaDecisao && (
        <div
          className="w-full max-w-[17rem] -rotate-1 justify-self-start rounded-md border-4 border-double border-carimbo px-4 py-3 text-carimbo sm:-rotate-2 sm:justify-self-end"
          aria-label="Última decisão"
        >
          <p className="text-[13px] font-semibold">Última decisão</p>
          <p className="mt-0.5 font-serif text-xl leading-snug font-semibold">{atoDaDecisao(ultimaDecisao.texto)}</p>
          <p className="mt-1.5 text-[13px]">
            Evento {ultimaDecisao.evento}, {formatarDataExtenso(ultimaDecisao.data)}
          </p>
        </div>
      )}
    </section>
  );
}
