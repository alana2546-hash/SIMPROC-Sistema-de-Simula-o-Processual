"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";
import { criarProcesso } from "@/app/admin/acoes";
import { FormProcesso } from "@/app/admin/processos/FormProcesso";

export function NovoProcesso({ comecarAberto }: { comecarAberto: boolean }) {
  const [aberto, setAberto] = useState(comecarAberto);

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="inline-flex w-fit items-center gap-2 rounded-full bg-tinta px-4 py-2 text-sm font-medium text-white hover:bg-tinta/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-carimbo"
      >
        <Plus className="size-4" aria-hidden />
        Novo processo
      </button>
    );
  }

  return (
    <section aria-labelledby="titulo-novo-processo" className="rounded-2xl border border-linha bg-folha p-5 sm:p-6">
      <div className="mb-1 flex items-center justify-between gap-3">
        <h2 id="titulo-novo-processo" className="font-serif text-xl font-semibold">
          Novo processo
        </h2>
        {!comecarAberto && (
          <button
            type="button"
            onClick={() => setAberto(false)}
            className="inline-flex items-center gap-1 text-sm text-tinta-suave hover:text-tinta"
          >
            <X className="size-4" aria-hidden />
            Fechar
          </button>
        )}
      </div>
      <p className="mb-4 text-sm text-tinta-suave">O número no padrão CNJ, com tribunal fictício 8.99, é gerado ao criar.</p>
      <FormProcesso acao={criarProcesso} rotulo="Criar processo" />
    </section>
  );
}
