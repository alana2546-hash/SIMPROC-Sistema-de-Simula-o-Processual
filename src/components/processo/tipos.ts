import { BellRing, CalendarClock, FileText, Gavel, Paperclip, ScrollText, Stamp, type LucideIcon } from "lucide-react";
import type { TipoMovimentacao } from "@/lib/dominio/formularios";

type Visual = {
  rotulo: string;
  plural: string;
  Icone: LucideIcon;
  /** nó na linha do tempo */
  no: string;
  /** cor do nome do tipo */
  texto: string;
};

// A decisão é o ato de maior peso: nó em tinta cheia. A intimação carrega o
// prazo: lacre. Os demais atos ficam em contorno, cada um com sua tinta.
export const VISUAL_TIPO: Record<TipoMovimentacao, Visual> = {
  decisao: { rotulo: "Decisão", plural: "Decisões", Icone: Gavel, no: "bg-tinta text-white ring-tinta", texto: "text-tinta" },
  intimacao: { rotulo: "Intimação", plural: "Intimações", Icone: BellRing, no: "bg-lacre text-white ring-lacre", texto: "text-lacre" },
  juntada: { rotulo: "Juntada", plural: "Juntadas", Icone: Paperclip, no: "bg-folha text-carimbo ring-carimbo", texto: "text-carimbo" },
  audiencia: { rotulo: "Audiência", plural: "Audiências", Icone: CalendarClock, no: "bg-folha text-audiencia ring-audiencia", texto: "text-audiencia" },
  certidao: { rotulo: "Certidão", plural: "Certidões", Icone: Stamp, no: "bg-folha text-certidao ring-certidao", texto: "text-certidao" },
  despacho: { rotulo: "Despacho", plural: "Despachos", Icone: ScrollText, no: "bg-folha text-despacho ring-despacho", texto: "text-despacho" },
  outro: { rotulo: "Outro", plural: "Outros", Icone: FileText, no: "bg-folha text-despacho ring-despacho", texto: "text-despacho" },
};

export const ORDEM_FILTROS: TipoMovimentacao[] = ["decisao", "juntada", "intimacao", "audiencia", "certidao", "despacho", "outro"];
