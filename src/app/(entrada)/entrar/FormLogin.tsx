"use client";

import { ArrowRight, Mail } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { entrar, type EstadoForm } from "@/app/acoes-auth";
import { BotaoPrincipal } from "../BotaoPrincipal";
import { CampoSenha } from "../CampoSenha";
import { estilosEntrada as s } from "../TelaEntrada";

export function FormLogin({ voltar }: { voltar: string }) {
  const [estado, acao] = useActionState<EstadoForm, FormData>(entrar, {});

  return (
    <>
      <div className={s["login-heading"]}>
        <h3>
          Bem-vindo(a) ao <strong>SIMPROC</strong>
        </h3>
        <p>
          Acesse sua conta e continue sua jornada{" "}
          <br />
          no estudo prático do Direito.
        </p>
      </div>

      <form className={s["login-form"]} action={acao}>
        <input type="hidden" name="voltar" value={voltar} />

        <label>
          <span>E-mail</span>
          <div className={s["input-wrapper"]}>
            <Mail size={20} aria-hidden />
            <input
              name="email"
              type="email"
              placeholder="seu@email.com"
              autoComplete="email"
              required
              defaultValue={estado.valores?.email}
            />
          </div>
        </label>

        <label>
          <span>Senha</span>
          <CampoSenha autoComplete="current-password" />
        </label>

        {estado.erro && (
          <p className={s["form-erro"]} role="alert">
            {estado.erro}
          </p>
        )}

        <BotaoPrincipal rotulo="Entrar" enviando="Entrando…" />
      </form>

      <div className={s.signup}>
        <span>Ainda não tem inscrição?</span>
        <Link href="/cadastro" className={s["signup-link"]}>
          Criar conta
          <ArrowRight size={18} aria-hidden />
        </Link>
      </div>
    </>
  );
}
