import { Cabecalho } from "@/components/Cabecalho";
import { exigirAdmin } from "@/lib/auth/sessao";
import { NavAdmin } from "./NavAdmin";

export default async function LayoutAdmin({ children }: LayoutProps<"/admin">) {
  const perfil = await exigirAdmin();
  return (
    <>
      <Cabecalho perfil={perfil} inicio="/admin" />
      <NavAdmin />
      <main className="mx-auto grid w-full max-w-6xl content-start gap-5 px-4 py-6 sm:py-8">{children}</main>
    </>
  );
}
