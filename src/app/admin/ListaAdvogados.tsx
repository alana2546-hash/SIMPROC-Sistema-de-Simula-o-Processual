import { aprovarInscricao, recusarInscricao } from "@/app/admin/acoes";
import { BotaoEnviar } from "@/components/BotaoEnviar";
import { formatarOab } from "@/lib/dominio/oab";
import type { Perfil } from "@/lib/tipos";

const ROTULO_STATUS: Record<Perfil["status"], string> = {
  pendente: "Pendente",
  aprovado: "Aprovado",
  recusado: "Recusado",
};

export function ListaAdvogados({ perfis, vazio }: { perfis: Perfil[]; vazio: string }) {
  if (perfis.length === 0) {
    return <p className="rounded-lg border border-neutral-200 bg-white p-4 text-neutral-700">{vazio}</p>;
  }
  return (
    <ul className="grid gap-2">
      {perfis.map((p) => (
        <li key={p.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-neutral-200 bg-white p-3">
          <div className="min-w-0 flex-1">
            <p className="font-medium">{p.nome}</p>
            <p className="text-sm break-all text-neutral-600">
              {p.email} · matrícula {p.matricula} · {p.semestre} semestre
            </p>
            <p className="text-xs text-neutral-500">
              {ROTULO_STATUS[p.status]}
              {p.oab_numero ? ` · ${formatarOab(p.oab_numero)}` : ""}
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
      ))}
    </ul>
  );
}
