"use client";

import { ArrowRight, GraduationCap, Hash, Mail, UserRound } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { cadastrar, type EstadoForm } from "@/app/acoes-auth";
import { BotaoPrincipal } from "../BotaoPrincipal";
import { CampoSenha } from "../CampoSenha";
import { estilosEntrada as s } from "../TelaEntrada";

export default function PaginaCadastro() {
  const [estado, acao] = useActionState<EstadoForm, FormData>(cadastrar, {});
  const v = estado.valores;

  return (
    <>
      <div className={s["login-heading"]}>
        <h3>
          Pedido de <strong>inscrição</strong>
        </h3>
        <p>
          A coordenação da liga analisa o pedido. Deferida a inscrição, você recebe seu número na OAB/SIMPROC e passa a
          acompanhar o processo da sua equipe.
        </p>
      </div>

      <form className={s["login-form"]} action={acao}>
        <label>
          <span>Nome completo</span>
          <div className={s["input-wrapper"]}>
            <UserRound size={20} aria-hidden />
            <input name="nome" autoComplete="name" placeholder="Seu nome" required defaultValue={v?.nome} />
          </div>
        </label>

        <div className={s["campos-duplos"]}>
          <label>
            <span>Matrícula</span>
            <div className={s["input-wrapper"]}>
              <Hash size={18} aria-hidden />
              <input name="matricula" placeholder="000000" required defaultValue={v?.matricula} />
            </div>
          </label>
          <label>
            <span>Semestre</span>
            <div className={s["input-wrapper"]}>
              <GraduationCap size={19} aria-hidden />
              <input name="semestre" placeholder="ex.: 5º" required defaultValue={v?.semestre} />
            </div>
          </label>
        </div>

        <label>
          <span>E-mail</span>
          <div className={s["input-wrapper"]}>
            <Mail size={20} aria-hidden />
            <input name="email" type="email" placeholder="seu@email.com" autoComplete="email" required defaultValue={v?.email} />
          </div>
        </label>

        <label>
          <span>Senha</span>
          <CampoSenha autoComplete="new-password" minLength={8} />
          <small className={s.dica}>Pelo menos 8 caracteres.</small>
        </label>

        {estado.erro && (
          <p className={s["form-erro"]} role="alert">
            {estado.erro}
          </p>
        )}

        <BotaoPrincipal rotulo="Pedir inscrição" enviando="Enviando pedido…" />
      </form>

      <div className={s.signup}>
        <span>Já tem inscrição?</span>
        <Link href="/entrar" className={s["signup-link"]}>
          Entrar
          <ArrowRight size={18} aria-hidden />
        </Link>
      </div>
    </>
  );
}
