import { definirCliente, desvincularAdvogado, vincularAdvogado } from "@/app/admin/acoes";
import { BotaoEnviar } from "@/components/BotaoEnviar";
import { formatarOab } from "@/lib/dominio/oab";
import { agruparPorCliente, clienteDefinido, investigadosDoProcesso } from "@/lib/dominio/partes";
import type { Perfil } from "@/lib/tipos";
import { SeletorCliente } from "./SeletorCliente";

export type VinculoAdmin = {
  advogado_id: string;
  cliente: string | null;
  perfis: Pick<Perfil, "nome" | "oab_numero">;
};

export function DefensoresAdmin({
  processoId,
  reu,
  vinculos,
  disponiveis,
}: {
  processoId: string;
  reu: string;
  vinculos: VinculoAdmin[];
  disponiveis: Array<Pick<Perfil, "id" | "nome" | "oab_numero">>;
}) {
  const investigados = investigadosDoProcesso(reu);
  const { grupos, semCliente } = agruparPorCliente(vinculos, investigados);

  const linha = (v: VinculoAdmin) => (
    <li key={v.advogado_id} className="grid gap-1.5 text-sm">
      <span className="leading-tight">
        <span className="block">{v.perfis.nome}</span>
        {v.perfis.oab_numero && <span className="text-tinta-suave">{formatarOab(v.perfis.oab_numero)}</span>}
      </span>
      <div className="flex items-center gap-2">
        <SeletorCliente
          acao={definirCliente.bind(null, processoId, v.advogado_id)}
          investigados={investigados}
          atual={clienteDefinido(v.cliente, investigados)}
          rotulo={`Cliente de ${v.perfis.nome}`}
        />
        <form action={desvincularAdvogado.bind(null, processoId, v.advogado_id)}>
          <BotaoEnviar variant="outline" enviando="Desvinculando…">
            Desvincular
          </BotaoEnviar>
        </form>
      </div>
    </li>
  );

  return (
    <section className="min-w-0">
      <h2 className="flex items-baseline justify-between gap-2 font-serif text-lg font-semibold">
        Advogados constituídos
        <span className="font-sans text-sm font-normal text-tinta-suave tabular-nums">{vinculos.length}</span>
      </h2>

      {semCliente.length > 0 && (
        <div className="mt-3 rounded-xl border border-lacre/30 bg-lacre/[0.04] px-3 py-3">
          <h3 className="flex items-baseline justify-between gap-2 text-sm font-semibold text-lacre">
            Cliente a definir
            <span className="font-normal tabular-nums">{semCliente.length}</span>
          </h3>
          <p className="mt-0.5 text-xs text-tinta-suave">Escolha o cliente de cada advogado. Salva na hora.</p>
          <ul className="mt-3 grid gap-4">{semCliente.map(linha)}</ul>
        </div>
      )}

      <div className="mt-4 grid gap-5">
        {grupos.map((g) => (
          <div key={g.cliente}>
            <h3 className="flex items-baseline justify-between gap-2 border-b border-linha pb-1 font-serif font-semibold">
              {g.cliente}
              <span className="font-sans text-sm font-normal text-tinta-suave tabular-nums">{g.advogados.length}</span>
            </h3>
            {g.advogados.length === 0 ? (
              <p className="mt-2 text-xs text-tinta-suave">Nenhum advogado.</p>
            ) : (
              <ul className="mt-3 grid gap-4">{g.advogados.map(linha)}</ul>
            )}
          </div>
        ))}
      </div>

      {disponiveis.length > 0 ? (
        <form action={vincularAdvogado.bind(null, processoId)} className="mt-6 grid gap-2 border-t border-linha pt-4">
          <p className="text-sm font-semibold">Constituir advogado aprovado</p>
          <label htmlFor="advogado_id" className="text-xs text-tinta-suave">
            Advogado
          </label>
          <select
            id="advogado_id"
            name="advogado_id"
            required
            className="h-9 w-full min-w-0 rounded-lg border border-linha bg-folha px-2.5 text-sm"
          >
            {disponiveis.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
                {p.oab_numero ? `, ${formatarOab(p.oab_numero)}` : ""}
              </option>
            ))}
          </select>
          <label htmlFor="cliente_novo" className="text-xs text-tinta-suave">
            Cliente
          </label>
          <select
            id="cliente_novo"
            name="cliente"
            required
            defaultValue=""
            className="h-9 w-full min-w-0 rounded-lg border border-linha bg-folha px-2.5 text-sm"
          >
            <option value="" disabled>
              Escolher cliente
            </option>
            {investigados.map((nome) => (
              <option key={nome} value={nome}>
                {nome}
              </option>
            ))}
          </select>
          <BotaoEnviar enviando="Constituindo…">Constituir</BotaoEnviar>
        </form>
      ) : (
        <p className="mt-4 text-xs text-tinta-suave">Nenhum outro advogado aprovado disponível.</p>
      )}
    </section>
  );
}
