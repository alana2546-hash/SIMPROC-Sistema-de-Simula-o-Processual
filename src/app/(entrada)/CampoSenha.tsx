"use client";

import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useState } from "react";
import { estilosEntrada as s } from "./TelaEntrada";

export function CampoSenha({ autoComplete, minLength }: { autoComplete: "current-password" | "new-password"; minLength?: number }) {
  const [mostrar, setMostrar] = useState(false);
  return (
    <div className={s["input-wrapper"]}>
      <LockKeyhole size={19} aria-hidden />
      <input
        name="senha"
        type={mostrar ? "text" : "password"}
        placeholder="••••••••"
        autoComplete={autoComplete}
        minLength={minLength}
        required
      />
      <button
        className={s["password-button"]}
        type="button"
        aria-label={mostrar ? "Ocultar senha" : "Mostrar senha"}
        aria-pressed={mostrar}
        onClick={() => setMostrar(!mostrar)}
      >
        {mostrar ? <Eye size={18} aria-hidden /> : <EyeOff size={18} aria-hidden />}
      </button>
    </div>
  );
}
