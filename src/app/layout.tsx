import type { Metadata } from "next";
import { Public_Sans, Source_Serif_4 } from "next/font/google";
import "./globals.css";

// Public Sans: tipografia institucional para o texto corrido e a interface.
const publica = Public_Sans({
  variable: "--font-publica",
  subsets: ["latin"],
});

// Source Serif 4: números de processo, datas e o texto das decisões.
const autos = Source_Serif_4({
  variable: "--font-autos",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SIMPROC",
  description: "Sistema de Simulação Processual — liga de Direito Processual Penal",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${publica.variable} ${autos.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-papel font-sans text-tinta">{children}</body>
    </html>
  );
}
