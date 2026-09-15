"use client";

import Link from "next/link";
import { useActionState } from "react";
import { entrar, type EstadoForm } from "@/app/acoes-auth";
import { BotaoEnviar } from "@/components/BotaoEnviar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function FormEntrar({ voltar }: { voltar: string }) {
  const [estado, acao] = useActionState<EstadoForm, FormData>(entrar, {});
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Entrar</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={acao} className="grid gap-4">
          <input type="hidden" name="voltar" value={voltar} />
          <div className="grid gap-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="senha">Senha</Label>
            <Input id="senha" name="senha" type="password" autoComplete="current-password" required />
          </div>
          {estado.erro && (
            <Alert variant="destructive">
              <AlertDescription>{estado.erro}</AlertDescription>
            </Alert>
          )}
          <BotaoEnviar enviando="Entrando…">Entrar</BotaoEnviar>
          <p className="text-center text-sm text-neutral-600">
            Ainda não é inscrito?{" "}
            <Link href="/cadastro" className="font-medium text-[#1d2b45] underline">
              Pedir inscrição
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
