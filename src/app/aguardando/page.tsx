import { redirect } from "next/navigation";
import { sair } from "@/app/acoes-auth";
import { MarcaSimproc } from "@/components/MarcaSimproc";
import { destinoInicial, obterPerfil } from "@/lib/auth/sessao";

export default async function PaginaAguardando() {
  const perfil = await obterPerfil();
  const destino = destinoInicial(perfil);
  if (destino !== "/aguardando") redirect(destino);

  const recusado = perfil!.status === "recusado";
  return (
    <main className="mx-auto grid w-full max-w-md content-start gap-8 px-4 py-12 sm:py-20">
      <MarcaSimproc />
      <section
        className={`rounded-2xl border bg-folha p-6 sm:p-8 ${recusado ? "border-lacre/40 border-l-4 border-l-lacre" : "border-linha"}`}
      >
        <p className="text-sm text-tinta-suave">{perfil!.nome}</p>
        <h1 className="mt-1 font-serif text-2xl font-semibold">
          {recusado ? "Pedido de inscrição indeferido" : "Pedido de inscrição em análise"}
        </h1>
        <p className="mt-3 text-tinta/90">
          {recusado
            ? "Procure a coordenação da liga para saber o motivo e, se for o caso, pedir nova análise."
            : "Assim que a coordenação deferir, seu número na OAB/SIMPROC aparece no topo da tela e você passa a acompanhar o processo da sua equipe. Volte a entrar mais tarde."}
        </p>
        <form action={sair} className="mt-6 border-t border-linha pt-5">
          <button type="submit" className="text-sm font-medium text-carimbo underline-offset-2 hover:underline">
            Sair
          </button>
        </form>
      </section>
    </main>
  );
}
