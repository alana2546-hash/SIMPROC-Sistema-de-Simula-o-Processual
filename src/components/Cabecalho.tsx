import Link from "next/link";
import { sair } from "@/app/acoes-auth";
import { formatarOab } from "@/lib/dominio/oab";
import type { Perfil } from "@/lib/tipos";

export function Cabecalho({ perfil, inicio }: { perfil: Perfil | null; inicio: string }) {
  return (
    <header className="bg-[#1d2b45] text-white">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
        <Link href={inicio} className="leading-tight">
          <span className="block text-lg font-semibold tracking-wide">SIMPROC</span>
          <span className="block text-xs text-white/70">Sistema de Simulação Processual</span>
        </Link>
        {perfil && (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-right leading-tight">
              <span className="block">{perfil.nome}</span>
              <span className="block text-xs text-white/70">
                {perfil.papel === "admin"
                  ? "Administrador"
                  : perfil.oab_numero
                    ? formatarOab(perfil.oab_numero)
                    : "Inscrição em análise"}
              </span>
            </span>
            <form action={sair}>
              <button type="submit" className="rounded-md border border-white/30 px-2.5 py-1 text-xs hover:bg-white/10">
                Sair
              </button>
            </form>
          </div>
        )}
      </div>
    </header>
  );
}
