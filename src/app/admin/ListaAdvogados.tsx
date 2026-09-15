import { aprovarInscricao, recusarInscricao } from "@/app/admin/acoes";
import { BotaoEnviar } from "@/components/BotaoEnviar";
import { formatarOab } from "@/lib/dominio/oab";
import type { Perfil } from "@/lib/tipos";

const STATUS: Record<Perfil["status"], { rotulo: string; classe: string }> = {
  pendente: { rotulo: "Pendente", classe: "text-carimbo" },
  aprovado: { rotulo: "Aprovado", classe: "text-certidao" },
  recusado: { rotulo: "Recusado", classe: "text-lacre" },
};

export function ListaAdvogados({ perfis, vazio }: { perfis: Perfil[]; vazio: string }) {
  if (perfis.length === 0) {
    return <p className="rounded-2xl border border-dashed border-linha bg-folha px-6 py-8 text-tinta-suave">{vazio}</p>;
  }
  return (
    <ul className="divide-y divide-linha overflow-hidden rounded-2xl border border-linha bg-folha">
      {perfis.map((p) => {
        const status = STATUS[p.status];
        return (
          <li key={p.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-6">
            <div className="min-w-0">
              <p className="flex flex-wrap items-baseline gap-x-3">
                <span className="font-medium">{p.nome}</span>
                <span className={`text-sm font-semibold ${status.classe}`}>{status.rotulo}</span>
                {p.oab_numero && <span className="text-sm text-tinta-suave">{formatarOab(p.oab_numero)}</span>}
              </p>
              <p className="mt-0.5 text-sm break-all text-tinta-suave">{p.email}</p>
              <p className="text-sm text-tinta-suave">
                Matrícula {p.matricula}, {p.semestre} semestre
              </p>
            </div>
            <div className="flex gap-2">
              {p.status !== "aprovado" && (
                <form action={aprovarInscricao.bind(null, p.id)}>
                  <BotaoEnviar enviando="Aprovando…">Aprovar</BotaoEnviar>
                </form>
              )}
              {p.status !== "recusado" && (
                <form action={recusarInscricao.bind(null, p.id)}>
                  <BotaoEnviar variant="outline" enviando="Recusando…">
                    Recusar
                  </BotaoEnviar>
                </form>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
