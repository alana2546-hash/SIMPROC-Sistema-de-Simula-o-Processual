import Link from "next/link";
import { criarProcesso } from "@/app/admin/acoes";
import { FormProcesso } from "@/app/admin/processos/FormProcesso";
import { criarClienteServidor } from "@/lib/supabase/servidor";

type Linha = {
  id: string;
  numero: string;
  reu: string;
  imputacao: string;
  processo_advogados: Array<{ advogado_id: string }>;
};

export default async function Processos() {
  const supabase = await criarClienteServidor();
  const { data } = await supabase
    .from("processos")
    .select("id, numero, reu, imputacao, processo_advogados(advogado_id)")
    .order("criado_em", { ascending: false });
  const processos = (data ?? []) as Linha[];

  return (
    <>
      <h1 className="text-xl font-semibold">Processos</h1>

      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="mb-3 font-medium">Novo processo</h2>
        <p className="mb-3 text-sm text-neutral-600">O número CNJ (tribunal fictício 8.99) é gerado ao criar.</p>
        <FormProcesso acao={criarProcesso} rotulo="Criar processo" />
      </section>

      {processos.length === 0 ? (
        <p className="rounded-lg border border-neutral-200 bg-white p-4 text-neutral-700">Nenhum processo criado.</p>
      ) : (
        <ul className="grid gap-2">
          {processos.map((p) => (
            <li key={p.id}>
              <Link
                href={`/admin/processos/${p.id}`}
                className="block rounded-lg border border-neutral-200 bg-white p-3 hover:border-[#1d2b45]"
              >
                <span className="font-mono font-semibold break-all">{p.numero}</span>
                <p className="text-sm text-neutral-700">
                  Réu: {p.reu} · {p.imputacao} · {p.processo_advogados.length} advogado(s)
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
