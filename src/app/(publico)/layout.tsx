import { Cabecalho } from "@/components/Cabecalho";

export default function LayoutPublico({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Cabecalho perfil={null} inicio="/entrar" />
      <main className="mx-auto w-full max-w-md px-4 py-10">{children}</main>
    </>
  );
}
