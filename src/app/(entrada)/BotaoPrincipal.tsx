"use client";

import { ArrowRight } from "lucide-react";
import { useFormStatus } from "react-dom";
import { estilosEntrada as s } from "./TelaEntrada";

export function BotaoPrincipal({ rotulo, enviando }: { rotulo: string; enviando: string }) {
  const { pending } = useFormStatus();
  return (
    <button className={s["login-button"]} type="submit" disabled={pending}>
      <span>{pending ? enviando : rotulo}</span>
      <ArrowRight size={23} aria-hidden />
    </button>
  );
}
