"use client";

import Link from "next/link";
import { useActionState } from "react";
import { cadastrar, type EstadoForm } from "@/app/acoes-auth";
import { BotaoEnviar } from "@/components/BotaoEnviar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function PaginaCadastro() {
  const [estado, acao] = useActionState<EstadoForm, FormData>(cadastrar, {});
  return (
    <section className="rounded-2xl border border-linha bg-folha p-6 sm:p-8">
      <h1 className="font-serif text-2xl font-semibold">Pedido de inscrição</h1>
      <p className="mt-2 text-tinta-suave">
        A coordenação da liga analisa o pedido. Deferida a inscrição, você recebe seu número na OAB/SIMPROC e passa a
        acompanhar o processo da sua equipe.
      </p>
      <form action={acao} className="mt-6 grid gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="nome">Nome completo</Label>
          <Input id="nome" name="nome" autoComplete="name" required className="h-10" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="matricula">Matrícula</Label>
            <Input id="matricula" name="matricula" required className="h-10" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="semestre">Semestre</Label>
            <Input id="semestre" name="semestre" placeholder="ex.: 5º" required className="h-10" />
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required className="h-10" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="senha">Senha</Label>
          <Input id="senha" name="senha" type="password" autoComplete="new-password" minLength={8} required className="h-10" />
          <p className="text-xs text-tinta-suave">Pelo menos 8 caracteres.</p>
        </div>
        {estado.erro && (
          <Alert variant="destructive">
            <AlertDescription>{estado.erro}</AlertDescription>
          </Alert>
        )}
        <BotaoEnviar enviando="Enviando pedido…" className="h-10">
          Pedir inscrição
        </BotaoEnviar>
      </form>
      <p className="mt-5 border-t border-linha pt-5 text-sm text-tinta-suave">
        Já tem inscrição?{" "}
        <Link href="/entrar" className="font-medium text-carimbo underline-offset-2 hover:underline">
          Entrar
        </Link>
      </p>
    </section>
  );
}
