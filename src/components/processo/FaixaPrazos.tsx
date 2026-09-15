import { prazosEmAberto, statusPrazo } from "@/lib/dominio/datas";
import { formatarDataExtenso } from "@/lib/dominio/linha-do-tempo";
import type { Movimentacao } from "@/lib/tipos";

export function FaixaPrazos({
  movimentacoes,
  numeros,
  hoje,
  perspectiva,
}: {
  movimentacoes: Movimentacao[];
  numeros: Record<string, number>;
  hoje: string;
  perspectiva: "aluno" | "admin";
}) {
  const prazos = prazosEmAberto(movimentacoes, hoje);
  if (prazos.length === 0) return null;

  return (
    <section aria-label="Prazos em aberto" className="grid gap-3">
      {prazos.map((m) => {
        const s = statusPrazo(m.prazo_final, hoje);
        if (s.tipo === "fora_do_bloco") return null; // prazosEmAberto já exclui; explícito para o tipo
        const vencido = s.tipo === "vencido";
        const dataFinal = formatarDataExtenso(m.prazo_final);
        const destaque = s.tipo === "vence_hoje" ? "Hoje" : String(s.dias);
        const legenda =
          s.tipo === "vence_hoje"
            ? "último dia"
            : s.tipo === "a_vencer"
              ? s.dias === 1 ? "dia restante" : "dias restantes"
              : s.dias === 1 ? "dia de atraso" : "dias de atraso";
        const frase = vencido
          ? `O prazo terminou em ${dataFinal}`
          : perspectiva === "aluno"
            ? `Seu prazo termina em ${dataFinal}`
            : `O prazo das defesas termina em ${dataFinal}`;

        return (
          <div
            key={m.id}
            className={`flex items-center gap-4 rounded-2xl border px-5 py-4 sm:gap-6 sm:px-8 ${
              vencido ? "border-lacre bg-lacre text-white" : "border-lacre/35 bg-lacre/[0.06]"
            }`}
          >
            <div className="shrink-0 text-center">
              <p className={`font-serif text-4xl leading-none tabular-nums sm:text-5xl ${vencido ? "" : "text-lacre"}`}>{destaque}</p>
              <p className={`mt-1 text-xs ${vencido ? "text-white/85" : "text-lacre"}`}>{legenda}</p>
            </div>
            <div className="min-w-0">
              <p className="font-semibold">{frase}</p>
              <p className={`mt-0.5 text-sm ${vencido ? "text-white/85" : "text-tinta-suave"}`}>
                Intimação do evento {numeros[m.id]}, publicada em {formatarDataExtenso(m.data)}.
              </p>
            </div>
          </div>
        );
      })}
    </section>
  );
}
