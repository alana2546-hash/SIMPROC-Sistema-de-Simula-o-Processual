"use client";

import { useActionState } from "react";
import type { EstadoForm } from "@/app/acoes-auth";
import { BotaoEnviar } from "@/components/BotaoEnviar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Processo } from "@/lib/tipos";

export function FormProcesso({
  acao,
  processo,
  rotulo,
}: {
  acao: (anterior: EstadoForm, formData: FormData) => Promise<EstadoForm>;
  processo?: Processo;
  rotulo: string;
}) {
  const [estado, enviar] = useActionState<EstadoForm, FormData>(acao, {});
  const campos: Array<[keyof Processo, string, string]> = [
    ["classe", "Classe", "Ação Penal – Procedimento Comum Ordinário"],
    ["juizo", "Juízo", "1ª Vara Criminal da Comarca de SIMPROC"],
    ["reu", "Réu", "Nome fictício"],
    ["imputacao", "Imputação", "art. 157, §2º, II, do CP"],
  ];
  return (
    <form action={enviar} className="grid gap-3 sm:grid-cols-2">
      {campos.map(([nome, label, exemplo]) => (
        <div key={nome} className="grid gap-1.5">
          <Label htmlFor={nome}>{label}</Label>
          <Input id={nome} name={nome} defaultValue={processo?.[nome]} placeholder={exemplo} required />
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <BotaoEnviar enviando="Salvando…">{rotulo}</BotaoEnviar>
        {estado.ok && <span className="text-sm text-green-700">{estado.ok}</span>}
      </div>
      {estado.erro && (
        <Alert variant="destructive" className="sm:col-span-2">
          <AlertDescription>{estado.erro}</AlertDescription>
        </Alert>
      )}
    </form>
  );
}
