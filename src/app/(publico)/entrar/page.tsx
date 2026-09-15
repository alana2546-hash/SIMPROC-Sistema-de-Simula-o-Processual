import { redirect } from "next/navigation";
import { destinoInicial, obterPerfil } from "@/lib/auth/sessao";
import { FormEntrar } from "./FormEntrar";

export default async function PaginaEntrar({ searchParams }: PageProps<"/entrar">) {
  const perfil = await obterPerfil();
  if (perfil) redirect(destinoInicial(perfil));
  const { voltar } = await searchParams;
  return <FormEntrar voltar={typeof voltar === "string" ? voltar : ""} />;
}
