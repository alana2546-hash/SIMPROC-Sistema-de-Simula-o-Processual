import { FileText } from "lucide-react";
import { formatarDataExtenso } from "@/lib/dominio/linha-do-tempo";
import { formatarOab } from "@/lib/dominio/oab";
import type { Movimentacao, Processo } from "@/lib/tipos";

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  return `${partes[0]?.[0] ?? ""}${partes.length > 1 ? partes.at(-1)![0] : ""}`.toUpperCase();
}

export function SecaoPartes({ processo }: { processo: Processo }) {
  const pessoas = processo.reu.split(/,\s*|\s+e\s+/).map((p) => p.trim()).filter(Boolean);
  return (
    <section>
      <h2 className="font-serif text-lg font-semibold">{pessoas.length > 1 ? "Investigados" : "Investigado"}</h2>
      <ul className="mt-2 grid gap-1">
        {pessoas.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
      <h2 className="mt-5 font-serif text-lg font-semibold">Imputação</h2>
      <p className="mt-1 text-tinta/90">{processo.imputacao}</p>
    </section>
  );
}

export function SecaoAdvogados({ advogados }: { advogados: Array<{ nome: string; oab_numero: number | null }> }) {
  return (
    <section>
      <h2 className="font-serif text-lg font-semibold">Advogados constituídos</h2>
      {advogados.length === 0 ? (
        <p className="mt-1 text-sm text-tinta-suave">Nenhum advogado constituído ainda.</p>
      ) : (
        <ul className="mt-3 grid gap-3">
          {advogados.map((a) => (
            <li key={`${a.nome}-${a.oab_numero}`} className="flex items-center gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-carimbo/10 text-sm font-semibold text-carimbo" aria-hidden>
                {iniciais(a.nome)}
              </span>
              <span className="min-w-0 leading-tight">
                <span className="block">{a.nome}</span>
                {a.oab_numero && <span className="text-sm text-tinta-suave">{formatarOab(a.oab_numero)}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// Índice dos autos: todos os documentos em ordem cronológica, com o evento.
export function IndiceDocumentos({
  movimentacoes,
  numeros,
}: {
  movimentacoes: Movimentacao[];
  numeros: Record<string, number>;
}) {
  const documentos = [...movimentacoes]
    .sort((a, b) => numeros[a.id] - numeros[b.id])
    .flatMap((m) => m.anexos.map((a) => ({ ...a, evento: numeros[m.id], data: m.data })));

  return (
    <section>
      <h2 className="font-serif text-lg font-semibold">Documentos dos autos</h2>
      {documentos.length === 0 ? (
        <p className="mt-1 text-sm text-tinta-suave">Nenhum documento juntado.</p>
      ) : (
        <ol className="mt-3 grid gap-1">
          {documentos.map((d) => (
            <li key={d.id}>
              <a
                href={`/anexos/${d.id}`}
                target="_blank"
                rel="noopener"
                className="-mx-2 flex gap-2.5 rounded-md px-2 py-1.5 hover:bg-folha focus-visible:outline-2 focus-visible:outline-carimbo"
              >
                <FileText className="mt-0.5 size-4 shrink-0 text-carimbo" aria-hidden />
                <span className="min-w-0 leading-snug">
                  <span className="block text-sm">{d.nome_arquivo.replace(/\.pdf$/i, "")}</span>
                  <span className="block text-xs text-tinta-suave">
                    Evento {d.evento}, {formatarDataExtenso(d.data)}
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
