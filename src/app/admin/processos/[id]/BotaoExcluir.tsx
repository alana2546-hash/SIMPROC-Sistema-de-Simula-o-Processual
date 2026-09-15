"use client";

import { useState, useTransition } from "react";
import { excluirMovimentacao } from "@/app/admin/acoes";

// Exclusão em dois cliques, sem diálogo do navegador.
export function BotaoExcluir({ processoId, movimentacaoId }: { processoId: string; movimentacaoId: string }) {
  const [confirmando, setConfirmando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();

  if (!confirmando) {
    return (
      <button type="button" onClick={() => setConfirmando(true)} className="text-xs text-red-700 underline">
        Excluir
      </button>
    );
  }
  return (
    <span className="flex flex-wrap items-center gap-2 text-xs">
      <button
        type="button"
        disabled={pendente}
        onClick={() =>
          iniciar(async () => {
            const r = await excluirMovimentacao(processoId, movimentacaoId);
            if (r.erro) setErro(r.erro);
          })
        }
        className="rounded bg-red-700 px-2 py-0.5 font-medium text-white disabled:opacity-60"
      >
        {pendente ? "Excluindo…" : "Confirmar exclusão"}
      </button>
      <button type="button" onClick={() => setConfirmando(false)} className="underline">
        Cancelar
      </button>
      {erro && <span className="text-red-700">{erro}</span>}
    </span>
  );
}
