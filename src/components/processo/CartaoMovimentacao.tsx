import { formatarDataBr } from "@/lib/dominio/datas";
import { TIPOS_MOVIMENTACAO } from "@/lib/dominio/formularios";
import type { Movimentacao } from "@/lib/tipos";

function tamanho(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
}

export function CartaoMovimentacao({
  movimentacao: m,
  nova = false,
  acoes,
}: {
  movimentacao: Movimentacao;
  nova?: boolean;
  acoes?: React.ReactNode;
}) {
  return (
    <article
      className={`rounded-lg border bg-white p-4 ${nova ? "border-amber-400 ring-1 ring-amber-300" : "border-neutral-200"}`}
    >
      <header className="flex flex-wrap items-center gap-2 text-sm">
        <time className="font-mono text-neutral-600">{formatarDataBr(m.data)}</time>
        <span className="rounded bg-[#1d2b45] px-2 py-0.5 text-xs font-medium text-white">
          {TIPOS_MOVIMENTACAO[m.tipo]}
        </span>
        {nova && (
          <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">Novo</span>
        )}
        {acoes && <div className="ml-auto flex gap-2">{acoes}</div>}
      </header>
      <p className="mt-2 text-[15px] leading-relaxed whitespace-pre-wrap">{m.texto}</p>
      {m.prazo_final && (
        <p className="mt-2 text-sm font-medium text-neutral-800">Prazo final: {formatarDataBr(m.prazo_final)}</p>
      )}
      {m.anexos.length > 0 && (
        <ul className="mt-3 grid gap-1.5">
          {m.anexos.map((a) => (
            <li key={a.id}>
              <a
                href={`/anexos/${a.id}`}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-2 rounded border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-sm text-[#1d2b45] hover:bg-neutral-100"
              >
                <span aria-hidden>📄</span>
                <span className="underline">{a.nome_arquivo}</span>
                <span className="text-xs text-neutral-500">{tamanho(a.tamanho_bytes)}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
