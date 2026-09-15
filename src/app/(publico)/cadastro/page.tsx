"use client";

import Link from "next/link";
import { useActionState } from "react";
import { cadastrar, type EstadoForm } from "@/app/acoes-auth";
import { BotaoEnviar } from "@/components/BotaoEnviar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function PaginaCadastro() {
  const [estado, acao] = useActionState<EstadoForm, FormData>(cadastrar, {});
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Pedido de inscrição</CardTitle>
        <CardDescription>
          Depois do deferimento pela coordenação, você recebe seu número de inscrição e passa a acompanhar o
          processo da sua equipe.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={acao} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="nome">Nome completo</Label>
            <Input id="nome" name="nome" autoComplete="name" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="matricula">Matrícula</Label>
              <Input id="matricula" name="matricula" required />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="semestre">Semestre</Label>
              <Input id="semestre" name="semestre" placeholder="ex.: 5º" required />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="senha">Senha (mínimo 8 caracteres)</Label>
            <Input id="senha" name="senha" type="password" autoComplete="new-password" minLength={8} required />
          </div>
          {estado.erro && (
            <Alert variant="destructive">
              <AlertDescription>{estado.erro}</AlertDescription>
            </Alert>
          )}
          <BotaoEnviar enviando="Enviando pedido…">Pedir inscrição</BotaoEnviar>
          <p className="text-center text-sm text-neutral-600">
            Já é inscrito?{" "}
            <Link href="/entrar" className="font-medium text-[#1d2b45] underline">
              Entrar
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
