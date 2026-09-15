"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { EstadoForm } from "@/app/acoes-auth";
import { exigirAdmin } from "@/lib/auth/sessao";
import { numeroCnjFicticio } from "@/lib/dominio/cnj";
import { dataEmBrasilia } from "@/lib/dominio/datas";
import { validarMovimentacao, validarProcesso } from "@/lib/dominio/formularios";
import { criarClienteServidor } from "@/lib/supabase/servidor";

// Toda ação confere o admin de novo (não confia no layout). A RLS confere de
// novo no banco.

export async function aprovarInscricao(perfilId: string): Promise<void> {
  await exigirAdmin();
  const supabase = await criarClienteServidor();
  const { error } = await supabase.rpc("aprovar_inscricao", { p_perfil: perfilId });
  if (error) throw new Error(`Não foi possível aprovar: ${error.message}`);
  revalidatePath("/admin", "layout");
}

export async function recusarInscricao(perfilId: string): Promise<void> {
  await exigirAdmin();
  const supabase = await criarClienteServidor();
  const { error } = await supabase.rpc("recusar_inscricao", { p_perfil: perfilId });
  if (error) throw new Error(`Não foi possível recusar: ${error.message}`);
  revalidatePath("/admin", "layout");
}

export async function criarProcesso(_anterior: EstadoForm, formData: FormData): Promise<EstadoForm> {
  await exigirAdmin();
  const r = validarProcesso(Object.fromEntries(formData));
  if (!r.ok) return { erro: r.erro };

  const supabase = await criarClienteServidor();
  const { data: sequencial, error: erroSeq } = await supabase.rpc("proximo_sequencial_processo");
  if (erroSeq || typeof sequencial !== "number") return { erro: "Não foi possível gerar o número do processo." };

  const ano = Number(dataEmBrasilia(new Date()).slice(0, 4));
  const { data, error } = await supabase
    .from("processos")
    .insert({ ...r.dados, numero: numeroCnjFicticio(sequencial, ano) })
    .select("id")
    .single();
  if (error || !data) return { erro: `Não foi possível criar o processo: ${error?.message}` };

  revalidatePath("/admin/processos");
  redirect(`/admin/processos/${data.id}`);
}

export async function editarProcesso(processoId: string, _anterior: EstadoForm, formData: FormData): Promise<EstadoForm> {
  await exigirAdmin();
  const r = validarProcesso(Object.fromEntries(formData));
  if (!r.ok) return { erro: r.erro };

  const supabase = await criarClienteServidor();
  const { error } = await supabase.from("processos").update(r.dados).eq("id", processoId);
  if (error) return { erro: `Não foi possível salvar: ${error.message}` };
  revalidatePath(`/admin/processos/${processoId}`);
  return { ok: "Dados salvos." };
}

export async function vincularAdvogado(processoId: string, formData: FormData): Promise<void> {
  await exigirAdmin();
  const advogadoId = String(formData.get("advogado_id") ?? "");
  if (!advogadoId) return;
  const supabase = await criarClienteServidor();
  const { error } = await supabase.from("processo_advogados").insert({ processo_id: processoId, advogado_id: advogadoId });
  if (error) throw new Error(`Não foi possível constituir o advogado: ${error.message}`);
  revalidatePath(`/admin/processos/${processoId}`);
}

export async function desvincularAdvogado(processoId: string, advogadoId: string): Promise<void> {
  await exigirAdmin();
  const supabase = await criarClienteServidor();
  const { error } = await supabase
    .from("processo_advogados")
    .delete()
    .eq("processo_id", processoId)
    .eq("advogado_id", advogadoId);
  if (error) throw new Error(`Não foi possível desvincular: ${error.message}`);
  revalidatePath(`/admin/processos/${processoId}`);
}

export type NovaMovimentacao = {
  id: string;
  processoId: string;
  tipo: string;
  data: string;
  texto: string;
  prazo_final: string;
  anexos: Array<{ nome_arquivo: string; caminho: string }>;
};

// Os PDFs já foram enviados pelo navegador direto ao Storage (a Vercel não
// aceita requisição acima de 4,5 MB). Aqui só se registra; tamanho e tipo
// vêm do Storage, conferidos dentro da função SQL.
export async function publicarMovimentacao(entrada: NovaMovimentacao): Promise<{ erro?: string }> {
  await exigirAdmin();
  const r = validarMovimentacao(entrada);
  if (!r.ok) return { erro: r.erro };

  const supabase = await criarClienteServidor();
  const { error } = await supabase.rpc("publicar_movimentacao", {
    p_id: entrada.id,
    p_processo: entrada.processoId,
    p_tipo: r.dados.tipo,
    p_data: r.dados.data,
    p_texto: r.dados.texto,
    p_prazo_final: r.dados.prazo_final,
    p_anexos: entrada.anexos,
  });
  if (error) return { erro: `Não foi possível publicar: ${error.message}` };
  revalidatePath(`/admin/processos/${entrada.processoId}`);
  return {};
}

export async function excluirMovimentacao(processoId: string, movimentacaoId: string): Promise<{ erro?: string }> {
  await exigirAdmin();
  const supabase = await criarClienteServidor();

  const { data: anexos, error: erroAnexos } = await supabase
    .from("anexos")
    .select("caminho")
    .eq("movimentacao_id", movimentacaoId);
  if (erroAnexos) return { erro: `Não foi possível excluir: ${erroAnexos.message}` };

  const caminhos = (anexos ?? []).map((a: { caminho: string }) => a.caminho);
  if (caminhos.length > 0) {
    const { error } = await supabase.storage.from("autos").remove(caminhos);
    if (error) return { erro: `Os PDFs não puderam ser apagados; nada foi excluído. ${error.message}` };
  }

  const { error } = await supabase.from("movimentacoes").delete().eq("id", movimentacaoId);
  if (error) return { erro: `Não foi possível excluir: ${error.message}` };
  revalidatePath(`/admin/processos/${processoId}`);
  return {};
}
