"use server";

import { redirect } from "next/navigation";
import { destinoSeguro, mensagemErroAuth, validarCadastro } from "@/lib/dominio/formularios";
import { criarClienteServidor } from "@/lib/supabase/servidor";

// "valores" devolve o que foi digitado (nunca a senha): o React 19 limpa o
// formulário depois de cada envio, e sem isso o aluno redigita tudo após um erro.
export type EstadoForm = { erro?: string; ok?: string; valores?: Record<string, string> };

function texto(formData: FormData, campo: string): string {
  return String(formData.get(campo) ?? "");
}

export async function cadastrar(_anterior: EstadoForm, formData: FormData): Promise<EstadoForm> {
  const valores = {
    nome: texto(formData, "nome"),
    matricula: texto(formData, "matricula"),
    semestre: texto(formData, "semestre"),
    email: texto(formData, "email"),
  };
  const r = validarCadastro(Object.fromEntries(formData));
  if (!r.ok) return { erro: r.erro, valores };

  const supabase = await criarClienteServidor();
  const { data, error } = await supabase.auth.signUp({
    email: r.dados.email,
    password: r.dados.senha,
    options: { data: { nome: r.dados.nome, matricula: r.dados.matricula, semestre: r.dados.semestre } },
  });
  if (error) return { erro: mensagemErroAuth(error.code), valores };
  if (!data.session) {
    // Acontece se a confirmação por e-mail estiver ligada no Supabase.
    return { erro: "Pedido recebido, mas não foi possível entrar automaticamente. Avise a coordenação da liga.", valores };
  }
  redirect("/aguardando");
}

export async function entrar(_anterior: EstadoForm, formData: FormData): Promise<EstadoForm> {
  const email = texto(formData, "email").trim().toLowerCase();
  const senha = texto(formData, "senha");
  const valores = { email: texto(formData, "email") };
  if (!email || !senha) return { erro: "Informe e-mail e senha.", valores };

  const supabase = await criarClienteServidor();
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
  if (error) return { erro: mensagemErroAuth(error.code), valores };
  redirect(destinoSeguro(String(formData.get("voltar") ?? "")));
}

export async function sair(): Promise<void> {
  const supabase = await criarClienteServidor();
  await supabase.auth.signOut();
  redirect("/entrar");
}
