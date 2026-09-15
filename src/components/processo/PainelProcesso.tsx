import { FileText } from "lucide-react";
import { formatarDataExtenso } from "@/lib/dominio/linha-do-tempo";
import { formatarOab } from "@/lib/dominio/oab";
import { agruparPorCliente, investigadosDoProcesso } from "@/lib/dominio/partes";
import type { Defensor, Movimentacao, Processo } from "@/lib/tipos";

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  return `${partes[0]?.[0] ?? ""}${partes.length > 1 ? partes.at(-1)![0] : ""}`.toUpperCase();
}

function ListaDefensores({ advogados }: { advogados: Defensor[] }) {
  return (
    <ul className="mt-2.5 grid gap-2.5">
      {advogados.map((a) => (
        <li key={`${a.nome}-${a.oab_numero}`} className="flex items-center gap-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-carimbo/10 text-xs font-semibold text-carimbo" aria-hidden>
            {iniciais(a.nome)}
          </span>
          <span className="min-w-0 text-sm leading-tight">
            <span className="block">
              {a.nome}
              {a.eu && <span className="text-tinta-suave"> (você)</span>}
            </span>
            {a.oab_numero && <span className="text-tinta-suave">{formatarOab(a.oab_numero)}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

// Cada investigado com os advogados que o defendem, como nas procurações dos
// autos. O cliente de quem está vendo vem destacado.
export function SecaoPartes({ processo, advogados }: { processo: Processo; advogados: Defensor[] }) {
  const investigados = investigadosDoProcesso(processo.reu);
  const { grupos, semCliente } = agruparPorCliente(advogados, investigados);
  return (
    <section>
      <h2 className="font-serif text-lg font-semibold">
        {investigados.length > 1 ? "Investigados e defensores" : "Investigado e defensores"}
      </h2>
      <ul className="mt-3 grid gap-4">
        {grupos.map((g) => {
          const meu = g.advogados.some((a) => a.eu);
          return (
            <li key={g.cliente} className={meu ? "-mx-3 rounded-xl border border-carimbo/30 bg-carimbo/[0.05] px-3 py-3" : ""}>
              <h3 className="flex flex-wrap items-center gap-x-2 gap-y-1 font-serif font-semibold leading-snug">
                {g.cliente}
                {meu && (
                  <span className="rounded-full bg-carimbo px-2 py-0.5 font-sans text-xs font-semibold text-white">seu cliente</span>
                )}
              </h3>
              {g.advogados.length === 0 ? (
                <p className="mt-1 text-sm text-tinta-suave">Sem advogado constituído.</p>
              ) : (
                <ListaDefensores advogados={g.advogados} />
              )}
            </li>
          );
        })}
      </ul>
      {semCliente.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-tinta-suave">Cliente ainda não definido</h3>
          <ListaDefensores advogados={semCliente} />
        </div>
      )}
      <h2 className="mt-6 font-serif text-lg font-semibold">Imputação</h2>
      <p className="mt-1 text-tinta/90">{processo.imputacao}</p>
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
