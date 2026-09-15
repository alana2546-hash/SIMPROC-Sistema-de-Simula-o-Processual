"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

export function BotaoEnviar({
  children,
  enviando = "Enviando…",
  variant,
  className,
}: {
  children: React.ReactNode;
  enviando?: string;
  variant?: "default" | "outline" | "destructive" | "secondary" | "ghost";
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} variant={variant} className={className}>
      {pending ? enviando : children}
    </Button>
  );
}
