import { formatarDataBr, prazosEmAberto, rotuloPrazo, statusPrazo } from "@/lib/dominio/datas";
import { TIPOS_MOVIMENTACAO } from "@/lib/dominio/formularios";
import type { Movimentacao } from "@/lib/tipos";

export function PrazosEmAberto({ movimentacoes, hoje }: { movimentacoes: Movimentacao[]; hoje: string }) {
  const prazos = prazosEmAberto(movimentacoes, hoje);
  if (prazos.length === 0) return null;
  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-600">Prazos em aberto</h2>
      <ul className="mt-2 grid gap-2">
        {prazos.map((m) => {
          const status = statusPrazo(m.prazo_final, hoje);
          const cor =
            status.tipo === "vencido"
              ? "bg-red-50 text-red-800 border-red-200"
              : status.tipo === "vence_hoje"
                ? "bg-amber-50 text-amber-900 border-amber-300"
                : "bg-neutral-50 text-neutral-800 border-neutral-200";
          return (
            <li key={m.id} className={`flex flex-wrap items-baseline justify-between gap-2 rounded border px-3 py-2 text-sm ${cor}`}>
              <span>
                {TIPOS_MOVIMENTACAO[m.tipo]} de {formatarDataBr(m.data)} · prazo final {formatarDataBr(m.prazo_final)}
              </span>
              <strong>{rotuloPrazo(status)}</strong>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
