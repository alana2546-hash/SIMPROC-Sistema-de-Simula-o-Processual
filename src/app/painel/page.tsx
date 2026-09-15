import Link from "next/link";
import { Cabecalho } from "@/components/Cabecalho";
import { exigirAdvogado } from "@/lib/auth/sessao";
import { contarNovidades } from "@/lib/dominio/novidades";
import { clienteDefinido, investigadosDoProcesso } from "@/lib/dominio/partes";
import { criarClienteServidor } from "@/lib/supabase/servidor";

type ProcessoPainel = {
  id: string;
  numero: string;
  classe: string;
  juizo: string;
  reu: string;
  imputacao: string;
  movimentacoes: Array<{ publicada_em: string }>;
  processo_advogados: Array<{ advogado_id: string; cliente: string | null }>;
};

export default async function Painel() {
  const perfil = await exigirAdvogado();
  const supabase = await criarClienteServidor();

  const [{ data: processos }, { data: acessos }] = await Promise.all([
    supabase
      .from("processos")
      .select("id, numero, classe, juizo, reu, imputacao, movimentacoes(publicada_em), processo_advogados(advogado_id, cliente)")
      .order("criado_em"),
    supabase.from("acessos").select("processo_id, ultimo_acesso_em").eq("advogado_id", perfil.id),
  ]);

  const ultimoAcesso = new Map<string, string>(
    (acessos ?? []).map((a: { processo_id: string; ultimo_acesso_em: string }) => [a.processo_id, a.ultimo_acesso_em]),
  );
  const lista = (processos ?? []) as ProcessoPainel[];

  return (
    <>
      <Cabecalho perfil={perfil} inicio="/painel" />
      <main className="mx-auto grid w-full max-w-6xl content-start gap-6 px-4 py-8 sm:py-10">
        <div className="grid max-w-4xl gap-6">
        <h1 className="font-serif text-3xl font-semibold">Meus processos</h1>
        {lista.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-linha bg-folha px-6 py-8 text-tinta-suave">
            Você ainda não foi constituído em nenhum processo. Quando a coordenação vincular você à sua equipe, o
            processo aparece aqui.
          </p>
        ) : (
          <ul className="grid gap-4">
            {lista.map((p) => {
              const novidades = contarNovidades(p.movimentacoes, ultimoAcesso.get(p.id) ?? null);
              const meuVinculo = p.processo_advogados.find((v) => v.advogado_id === perfil.id);
              const cliente = clienteDefinido(meuVinculo?.cliente ?? null, investigadosDoProcesso(p.reu));
              return (
                <li key={p.id}>
                  {/* prefetch desligado: abrir o processo registra o acesso */}
                  <Link
                    href={`/processos/${p.id}`}
                    prefetch={false}
                    className="grid gap-4 rounded-2xl border border-linha bg-folha px-5 py-5 transition-colors hover:border-tinta/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-carimbo sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-7"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-tinta-suave">{p.classe}</p>
                      <p className="mt-0.5 font-serif text-xl font-semibold whitespace-nowrap tabular-nums sm:text-2xl">{p.numero}</p>
                      <p className="mt-1 text-tinta-suave">{p.juizo}</p>
                      <p className="mt-3 text-tinta/90">{p.reu}</p>
                      <p className="text-sm text-tinta-suave">{p.imputacao}</p>
                      {cliente ? (
                        <p className="mt-3 w-fit rounded-full bg-carimbo/10 px-3 py-1 text-sm text-carimbo">
                          Você defende <strong className="font-semibold">{cliente}</strong>
                        </p>
                      ) : (
                        <p className="mt-3 text-sm text-tinta-suave">Seu cliente ainda não foi definido pela coordenação.</p>
                      )}
                    </div>
                    {novidades > 0 ? (
                      <span className="w-fit rounded-full bg-lacre px-3 py-1 text-sm font-semibold text-white">
                        {novidades === 1 ? "1 novidade" : `${novidades} novidades`}
                      </span>
                    ) : (
                      <span className="w-fit text-sm text-tinta-suave">Sem novidades</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        </div>
      </main>
    </>
  );
}
