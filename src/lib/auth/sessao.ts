import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import type { Perfil } from "@/lib/tipos";

export const obterPerfil = cache(async (): Promise<Perfil | null> => {
  const supabase = await criarClienteServidor();
  const { data } = await supabase.auth.getClaims();
  const id = data?.claims?.sub;
  if (!id) return null;
  const { data: perfil } = await supabase.from("perfis").select("*").eq("id", id).maybeSingle();
  return (perfil as Perfil | null) ?? null;
});

export function destinoInicial(perfil: Perfil | null): string {
  if (!perfil) return "/entrar";
  if (perfil.papel === "admin") return "/admin";
  if (perfil.status !== "aprovado") return "/aguardando";
  return "/painel";
}

// Área do advogado: admin vai para /admin; pendente/recusado para /aguardando.
export async function exigirAdvogado(): Promise<Perfil> {
  const perfil = await obterPerfil();
  if (!perfil || perfil.papel !== "aluno" || perfil.status !== "aprovado") {
    redirect(destinoInicial(perfil));
  }
  return perfil;
}

// Área do admin: qualquer outro recebe 404 (nem sabe que a área existe).
export async function exigirAdmin(): Promise<Perfil> {
  const perfil = await obterPerfil();
  if (!perfil || perfil.papel !== "admin" || perfil.status !== "aprovado") notFound();
  return perfil;
}
