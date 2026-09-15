export type Resultado<T> = { ok: true; dados: T } | { ok: false; erro: string };

type Entrada = Record<string, unknown>;

export const TIPOS_MOVIMENTACAO = {
  despacho: "Despacho",
  decisao: "Decisão",
  intimacao: "Intimação",
  audiencia: "Audiência",
  juntada: "Juntada",
  certidao: "Certidão",
  outro: "Outro",
} as const;

export type TipoMovimentacao = keyof typeof TIPOS_MOVIMENTACAO;

export const TAMANHO_MAXIMO_ANEXO = 20 * 1024 * 1024;

function texto(valor: unknown): string {
  return typeof valor === "string" ? valor.trim() : "";
}

function dataValida(valor: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const d = new Date(`${valor}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === valor;
}

export function validarCadastro(entrada: Entrada): Resultado<{
  nome: string;
  email: string;
  senha: string;
  matricula: string;
  semestre: string;
}> {
  const nome = texto(entrada.nome);
  const email = texto(entrada.email).toLowerCase();
  const senha = typeof entrada.senha === "string" ? entrada.senha : "";
  const matricula = texto(entrada.matricula);
  const semestre = texto(entrada.semestre);

  if (!nome || !email || !matricula || !semestre) {
    return { ok: false, erro: "Preencha todos os campos." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, erro: "Informe um e-mail válido." };
  }
  if (senha.length < 8) {
    return { ok: false, erro: "A senha precisa ter pelo menos 8 caracteres." };
  }
  return { ok: true, dados: { nome, email, senha, matricula, semestre } };
}

export function validarProcesso(entrada: Entrada): Resultado<{
  classe: string;
  juizo: string;
  reu: string;
  imputacao: string;
}> {
  const dados = {
    classe: texto(entrada.classe),
    juizo: texto(entrada.juizo),
    reu: texto(entrada.reu),
    imputacao: texto(entrada.imputacao),
  };
  if (!dados.classe || !dados.juizo || !dados.reu || !dados.imputacao) {
    return { ok: false, erro: "Preencha classe, juízo, réu e imputação." };
  }
  return { ok: true, dados };
}

export function validarMovimentacao(entrada: Entrada): Resultado<{
  tipo: TipoMovimentacao;
  data: string;
  texto: string;
  prazo_final: string | null;
}> {
  const tipo = texto(entrada.tipo);
  const data = texto(entrada.data);
  const corpo = texto(entrada.texto);
  const prazo = texto(entrada.prazo_final);

  if (!(tipo in TIPOS_MOVIMENTACAO)) return { ok: false, erro: "Escolha o tipo da movimentação." };
  if (!dataValida(data)) return { ok: false, erro: "Informe uma data válida." };
  if (!corpo) return { ok: false, erro: "Escreva o texto da movimentação." };

  let prazo_final: string | null = null;
  if (tipo === "intimacao" && prazo) {
    if (!dataValida(prazo)) return { ok: false, erro: "Informe um prazo final válido." };
    prazo_final = prazo;
  }
  return { ok: true, dados: { tipo: tipo as TipoMovimentacao, data, texto: corpo, prazo_final } };
}

export function validarAnexo(arquivo: { name: string; size: number; type: string }): string | null {
  if (arquivo.type !== "application/pdf") return `“${arquivo.name}” não é PDF.`;
  if (arquivo.size > TAMANHO_MAXIMO_ANEXO) return `“${arquivo.name}” passa de 20 MB.`;
  return null;
}

// Evita redirecionamento para fora do site pelo parâmetro ?voltar=
export function destinoSeguro(voltar: string | null | undefined, padrao = "/"): string {
  if (!voltar || !voltar.startsWith("/") || voltar.startsWith("//") || voltar.startsWith("/\\")) {
    return padrao;
  }
  return voltar;
}

const MENSAGENS_AUTH: Record<string, string> = {
  user_already_exists: "Já existe inscrição com este e-mail.",
  email_exists: "Já existe inscrição com este e-mail.",
  invalid_credentials: "E-mail ou senha incorretos.",
  weak_password: "Senha fraca. Use pelo menos 8 caracteres, misturando letras e números.",
  over_request_rate_limit: "Muitas tentativas seguidas. Aguarde um pouco e tente de novo.",
};

export function mensagemErroAuth(codigo: string | undefined): string {
  return (codigo && MENSAGENS_AUTH[codigo]) || "Não foi possível concluir agora. Tente novamente.";
}
