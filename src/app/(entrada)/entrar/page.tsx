import { redirect } from "next/navigation";
import { destinoInicial, obterPerfil } from "@/lib/auth/sessao";
import { FormLogin } from "./FormLogin";

export default async function PaginaEntrar({ searchParams }: PageProps<"/entrar">) {
  const perfil = await obterPerfil();
  if (perfil) redirect(destinoInicial(perfil));
  const { voltar } = await searchParams;
  return <FormLogin voltar={typeof voltar === "string" ? voltar : ""} />;
}
