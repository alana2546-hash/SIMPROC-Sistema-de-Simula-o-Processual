import type { TipoMovimentacao } from "@/lib/dominio/formularios";

export type Perfil = {
  id: string;
  nome: string;
  email: string;
  matricula: string;
  semestre: string;
  papel: "aluno" | "admin";
  status: "pendente" | "aprovado" | "recusado";
  oab_numero: number | null;
  criado_em: string;
  decidido_em: string | null;
};

export type Processo = {
  id: string;
  numero: string;
  classe: string;
  juizo: string;
  reu: string;
  imputacao: string;
  criado_em: string;
};

// Advogado constituído como o aluno vê (função advogados_do_processo).
export type Defensor = {
  nome: string;
  oab_numero: number | null;
  cliente: string | null;
  eu: boolean;
};

export type Anexo = {
  id: string;
  nome_arquivo: string;
  tamanho_bytes: number;
};

export type Movimentacao = {
  id: string;
  tipo: TipoMovimentacao;
  data: string;
  texto: string;
  prazo_final: string | null;
  publicada_em: string;
  anexos: Anexo[];
};
