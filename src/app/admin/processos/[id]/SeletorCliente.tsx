"use client";

import { useFormStatus } from "react-dom";

// Trocar o cliente salva na hora, sem botão.
export function SeletorCliente({
  acao,
  investigados,
  atual,
  rotulo,
}: {
  acao: (formData: FormData) => Promise<void>;
  investigados: string[];
  atual: string | null;
  rotulo: string;
}) {
  return (
    <form action={acao} key={atual ?? ""} className="min-w-0 flex-1">
      <Campo investigados={investigados} atual={atual} rotulo={rotulo} />
    </form>
  );
}

function Campo({ investigados, atual, rotulo }: { investigados: string[]; atual: string | null; rotulo: string }) {
  const { pending } = useFormStatus();
  return (
    <select
      name="cliente"
      aria-label={rotulo}
      defaultValue={atual ?? ""}
      onChange={(e) => e.currentTarget.form?.requestSubmit()}
      aria-busy={pending}
      className={`h-8 w-full min-w-0 rounded-lg border bg-folha px-2 text-sm ${
        atual ? "border-linha" : "border-lacre/50 text-lacre"
      } ${pending ? "opacity-60" : ""}`}
    >
      {!atual && (
        <option value="" disabled>
          Escolher cliente
        </option>
      )}
      {investigados.map((nome) => (
        <option key={nome} value={nome}>
          {nome}
        </option>
      ))}
    </select>
  );
}
