// Datas "do calendário" (AAAA-MM-DD) sempre no fuso de Brasília.
// O servidor da Vercel roda em UTC: sem isso, "vence hoje" viraria
// "vence amanhã" depois das 21h.
const FUSO = "America/Sao_Paulo";
const DIAS_VENCIDO_NO_BLOCO = 7;
const MS_DIA = 86_400_000;

export function dataEmBrasilia(instante: Date): string {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: FUSO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instante);
  const valor = (tipo: string) => partes.find((p) => p.type === tipo)!.value;
  return `${valor("year")}-${valor("month")}-${valor("day")}`;
}

function diasEntre(de: string, ate: string): number {
  return Math.round((Date.parse(`${ate}T00:00:00Z`) - Date.parse(`${de}T00:00:00Z`)) / MS_DIA);
}

export type StatusPrazo =
  | { tipo: "vence_hoje" }
  | { tipo: "a_vencer"; dias: number }
  | { tipo: "vencido"; dias: number }
  | { tipo: "fora_do_bloco" };

export function statusPrazo(prazoFinal: string, hoje: string): StatusPrazo {
  const dias = diasEntre(hoje, prazoFinal);
  if (dias === 0) return { tipo: "vence_hoje" };
  if (dias > 0) return { tipo: "a_vencer", dias };
  if (-dias <= DIAS_VENCIDO_NO_BLOCO) return { tipo: "vencido", dias: -dias };
  return { tipo: "fora_do_bloco" };
}

export function rotuloPrazo(status: StatusPrazo): string {
  switch (status.tipo) {
    case "vence_hoje":
      return "Vence hoje";
    case "a_vencer":
      return status.dias === 1 ? "Vence amanhã" : `Vence em ${status.dias} dias`;
    case "vencido":
      return status.dias === 1 ? "Venceu ontem" : `Venceu há ${status.dias} dias`;
    case "fora_do_bloco":
      return "Vencido";
  }
}

export function prazosEmAberto<T extends { tipo: string; prazo_final: string | null }>(
  movimentacoes: T[],
  hoje: string,
): Array<T & { prazo_final: string }> {
  return movimentacoes
    .filter(
      (m): m is T & { prazo_final: string } =>
        m.tipo === "intimacao" &&
        m.prazo_final !== null &&
        statusPrazo(m.prazo_final, hoje).tipo !== "fora_do_bloco",
    )
    .sort((a, b) => a.prazo_final.localeCompare(b.prazo_final));
}

export function formatarDataBr(data: string): string {
  const [a, m, d] = data.split("-");
  return `${d}/${m}/${a}`;
}
