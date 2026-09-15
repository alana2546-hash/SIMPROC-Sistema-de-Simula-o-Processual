import Link from "next/link";
import { Cabecalho } from "@/components/Cabecalho";
import { exigirAdvogado } from "@/lib/auth/sessao";
import { contarNovidades } from "@/lib/dominio/novidades";
import { criarClienteServidor } from "@/lib/supabase/servidor";

type ProcessoPainel = {
  id: string;
  numero: string;
  reu: string;
  imputacao: string;
  movimentacoes: Array<{ publicada_em: string }>;
};

export default async function Painel() {
  const perfil = await exigirAdvogado();
  const supabase = await criarClienteServidor();

  const [{ data: processos }, { data: acessos }] = await Promise.all([
    supabase.from("processos").select("id, numero, reu, imputacao, movimentacoes(publicada_em)").order("criado_em"),
    supabase.from("acessos").select("processo_id, ultimo_acesso_em").eq("advogado_id", perfil.id),
  ]);

  const ultimoAcesso = new Map<string, string>(
    (acessos ?? []).map((a: { processo_id: string; ultimo_acesso_em: string }) => [a.processo_id, a.ultimo_acesso_em]),
  );
  const lista = (processos ?? []) as ProcessoPainel[];

  return (
    <>
      <Cabecalho perfil={perfil} inicio="/painel" />
      <main className="mx-auto w-full max-w-4xl px-4 py-6">
        <h1 className="mb-4 text-xl font-semibold">Meus processos</h1>
        {lista.length === 0 ? (
          <p className="rounded-lg border border-neutral-200 bg-white p-4 text-neutral-700">
            Você ainda não foi constituído em nenhum processo.
          </p>
        ) : (
          <ul className="grid gap-3">
            {lista.map((p) => {
              const novidades = contarNovidades(p.movimentacoes, ultimoAcesso.get(p.id) ?? null);
              return (
                <li key={p.id}>
                  {/* prefetch desligado: abrir o processo registra o acesso */}
                  <Link
                    href={`/processos/${p.id}`}
                    prefetch={false}
                    className="block rounded-lg border border-neutral-200 bg-white p-4 hover:border-[#1d2b45]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono font-semibold break-all">{p.numero}</span>
                      {novidades > 0 && (
                        <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">
                          {novidades === 1 ? "1 novidade" : `${novidades} novidades`}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-neutral-700">
                      Réu: {p.reu} · {p.imputacao}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}
