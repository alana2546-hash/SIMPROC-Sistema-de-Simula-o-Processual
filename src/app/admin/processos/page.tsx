import Link from "next/link";
import { NovoProcesso } from "@/app/admin/processos/NovoProcesso";
import { criarClienteServidor } from "@/lib/supabase/servidor";

type Linha = {
  id: string;
  numero: string;
  classe: string;
  juizo: string;
  reu: string;
  processo_advogados: Array<{ advogado_id: string }>;
  movimentacoes: Array<{ id: string }>;
};

export default async function Processos() {
  const supabase = await criarClienteServidor();
  const { data } = await supabase
    .from("processos")
    .select("id, numero, classe, juizo, reu, processo_advogados(advogado_id), movimentacoes(id)")
    .order("criado_em", { ascending: false });
  const processos = (data ?? []) as Linha[];

  return (
    <div className="grid max-w-4xl gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-serif text-3xl font-semibold">Processos</h1>
        {processos.length > 0 && <NovoProcesso comecarAberto={false} />}
      </div>

      {processos.length === 0 ? (
        <NovoProcesso comecarAberto />
      ) : (
        <ul className="grid gap-4">
          {processos.map((p) => (
            <li key={p.id}>
              <Link
                href={`/admin/processos/${p.id}`}
                className="grid gap-3 rounded-2xl border border-linha bg-folha px-5 py-5 transition-colors hover:border-tinta/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-carimbo sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-7"
              >
                <div className="min-w-0">
                  <p className="text-sm text-tinta-suave">{p.classe}</p>
                  <p className="mt-0.5 font-serif text-xl font-semibold whitespace-nowrap tabular-nums sm:text-2xl">{p.numero}</p>
                  <p className="mt-1 text-tinta-suave">{p.juizo}</p>
                  <p className="mt-3 text-tinta/90">{p.reu}</p>
                </div>
                <dl className="flex gap-6 text-sm">
                  <div>
                    <dt className="text-tinta-suave">Movimentações</dt>
                    <dd className="font-serif text-xl tabular-nums">{p.movimentacoes.length}</dd>
                  </div>
                  <div>
                    <dt className="text-tinta-suave">Advogados</dt>
                    <dd className="font-serif text-xl tabular-nums">{p.processo_advogados.length}</dd>
                  </div>
                </dl>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
