import { redirect } from "next/navigation";
import { destinoInicial, obterPerfil } from "@/lib/auth/sessao";

export default async function Inicio() {
  redirect(destinoInicial(await obterPerfil()));
}
