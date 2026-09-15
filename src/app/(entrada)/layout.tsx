import { DM_Sans, Playfair_Display } from "next/font/google";
import { TelaEntrada } from "./TelaEntrada";

// Fontes do layout das telas de entrada (login, cadastro, aguardando).
const sans = DM_Sans({ subsets: ["latin"], variable: "--fonte-login-sans" });
const serif = Playfair_Display({ subsets: ["latin"], variable: "--fonte-login-serif" });

// A moldura (imagem à esquerda, cartão à direita) fica no layout: ao navegar
// entre entrar, cadastro e aguardando, só o conteúdo do cartão troca.
export default function LayoutEntrada({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${sans.variable} ${serif.variable}`}>
      <TelaEntrada>{children}</TelaEntrada>
    </div>
  );
}
