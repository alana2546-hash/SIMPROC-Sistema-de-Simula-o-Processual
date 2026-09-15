"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ABAS = [
  { href: "/admin", rotulo: "Inscrições pendentes", ativa: (p: string) => p === "/admin" },
  { href: "/admin/advogados", rotulo: "Advogados", ativa: (p: string) => p.startsWith("/admin/advogados") },
  { href: "/admin/processos", rotulo: "Processos", ativa: (p: string) => p.startsWith("/admin/processos") },
];

export function NavAdmin() {
  const caminho = usePathname();
  return (
    <nav aria-label="Administração" className="border-b border-linha bg-folha">
      <div className="mx-auto flex max-w-6xl gap-6 overflow-x-auto px-4 text-sm">
        {ABAS.map((aba) => {
          const ativa = aba.ativa(caminho);
          return (
            <Link
              key={aba.href}
              href={aba.href}
              aria-current={ativa ? "page" : undefined}
              className={`-mb-px border-b-2 py-3 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-carimbo ${
                ativa ? "border-tinta font-semibold text-tinta" : "border-transparent text-tinta-suave hover:text-tinta"
              }`}
            >
              {aba.rotulo}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
