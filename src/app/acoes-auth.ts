"use server";

import { redirect } from "next/navigation";
import { destinoSeguro, mensagemErroAuth, validarCadastro } from "@/lib/dominio/formularios";
import { criarClienteServidor } from "@/lib/supabase/servidor";

export type EstadoForm = { erro?: string; ok?: string };

export async function cadastrar(_anterior: EstadoForm, formData: FormData): Promise<EstadoForm> {
  const r = validarCadastro(Object.fromEntries(formData));
  if (!r.ok) return { erro: r.erro };

  const supabase = await criarClienteServidor();
  const { data, error } = await supabase.auth.signUp({
    email: r.dados.email,
    password: r.dados.senha,
    options: { data: { nome: r.dados.nome, matricula: r.dados.matricula, semestre: r.dados.semestre } },
  });
  if (error) return { erro: mensagemErroAuth(error.code) };
  if (!data.session) {
    // Acontece se a confirmação por e-mail estiver ligada no Supabase.
    return { erro: "Pedido recebido, mas não foi possível entrar automaticamente. Avise a coordenação da liga." };
  }
  redirect("/aguardando");
}

export async function entrar(_anterior: EstadoForm, formData: FormData): Promise<EstadoForm> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const senha = String(formData.get("senha") ?? "");
  if (!email || !senha) return { erro: "Informe e-mail e senha." };

  const supabase = await criarClienteServidor();
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
  if (error) return { erro: mensagemErroAuth(error.code) };
  redirect(destinoSeguro(String(formData.get("voltar") ?? "")));
}

export async function sair(): Promise<void> {
  const supabase = await criarClienteServidor();
  await supabase.auth.signOut();
  redirect("/entrar");
}
