import { formatarOab } from "@/lib/dominio/oab";
import type { Processo } from "@/lib/tipos";

export function CabecalhoProcesso({
  processo,
  advogados,
}: {
  processo: Processo;
  advogados: Array<{ nome: string; oab_numero: number | null }>;
}) {
  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-neutral-500">Processo nº</p>
      <h1 className="font-mono text-lg font-semibold break-all sm:text-xl">{processo.numero}</h1>
      <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-neutral-500">Classe</dt>
          <dd>{processo.classe}</dd>
        </div>
        <div>
          <dt className="text-neutral-500">Juízo</dt>
          <dd>{processo.juizo}</dd>
        </div>
        <div>
          <dt className="text-neutral-500">Réu</dt>
          <dd>{processo.reu}</dd>
        </div>
        <div>
          <dt className="text-neutral-500">Imputação</dt>
          <dd>{processo.imputacao}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-neutral-500">Advogados constituídos</dt>
          <dd>
            {advogados.length === 0
              ? "Nenhum"
              : advogados
                  .map((a) => (a.oab_numero ? `${a.nome} (${formatarOab(a.oab_numero)})` : a.nome))
                  .join("; ")}
          </dd>
        </div>
      </dl>
    </section>
  );
}
