"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";
import { FormMovimentacao } from "./FormMovimentacao";

export function NovaMovimentacao({ processoId, hoje }: { processoId: string; hoje: string }) {
  const [aberto, setAberto] = useState(false);

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="inline-flex w-fit items-center gap-2 rounded-full bg-tinta px-4 py-2 text-sm font-medium text-white hover:bg-tinta/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-carimbo"
      >
        <Plus className="size-4" aria-hidden />
        Nova movimentação
      </button>
    );
  }

  return (
    <section aria-labelledby="titulo-nova" className="rounded-2xl border border-linha bg-folha p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id="titulo-nova" className="font-serif text-xl font-semibold">
          Nova movimentação
        </h2>
        <button
          type="button"
          onClick={() => setAberto(false)}
          className="inline-flex items-center gap-1 text-sm text-tinta-suave hover:text-tinta"
        >
          <X className="size-4" aria-hidden />
          Fechar
        </button>
      </div>
      <FormMovimentacao processoId={processoId} hoje={hoje} />
    </section>
  );
}
