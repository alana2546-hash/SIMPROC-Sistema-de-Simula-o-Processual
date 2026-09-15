import Link from "next/link";
import { Cabecalho } from "@/components/Cabecalho";
import { exigirAdmin } from "@/lib/auth/sessao";

export default async function LayoutAdmin({ children }: LayoutProps<"/admin">) {
  const perfil = await exigirAdmin();
  return (
    <>
      <Cabecalho perfil={perfil} inicio="/admin" />
      <nav className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-6xl gap-5 overflow-x-auto px-4 text-sm">
          {[
            ["/admin", "Inscrições pendentes"],
            ["/admin/advogados", "Advogados"],
            ["/admin/processos", "Processos"],
          ].map(([href, rotulo]) => (
            <Link key={href} href={href} className="py-3 whitespace-nowrap text-[#1d2b45] hover:underline">
              {rotulo}
            </Link>
          ))}
        </div>
      </nav>
      <main className="mx-auto grid w-full max-w-6xl gap-5 px-4 py-6 sm:py-8">{children}</main>
    </>
  );
}
