"use client";

import Link from "next/link";
import { useActionState } from "react";
import { entrar, type EstadoForm } from "@/app/acoes-auth";
import { BotaoEnviar } from "@/components/BotaoEnviar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function FormEntrar({ voltar }: { voltar: string }) {
  const [estado, acao] = useActionState<EstadoForm, FormData>(entrar, {});
  return (
    <section className="rounded-2xl border border-linha bg-folha p-6 sm:p-8">
      <h1 className="font-serif text-2xl font-semibold">Entrar</h1>
      <form action={acao} className="mt-5 grid gap-4">
        <input type="hidden" name="voltar" value={voltar} />
        <div className="grid gap-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required className="h-10" defaultValue={estado.valores?.email} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="senha">Senha</Label>
          <Input id="senha" name="senha" type="password" autoComplete="current-password" required className="h-10" />
        </div>
        {estado.erro && (
          <Alert variant="destructive">
            <AlertDescription>{estado.erro}</AlertDescription>
          </Alert>
        )}
        <BotaoEnviar enviando="Entrando…" className="h-10">
          Entrar
        </BotaoEnviar>
      </form>
      <p className="mt-5 border-t border-linha pt-5 text-sm text-tinta-suave">
        Ainda não tem inscrição?{" "}
        <Link href="/cadastro" className="font-medium text-carimbo underline-offset-2 hover:underline">
          Pedir inscrição como advogado
        </Link>
      </p>
    </section>
  );
}
