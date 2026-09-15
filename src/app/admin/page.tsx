import { ListaAdvogados } from "@/app/admin/ListaAdvogados";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import type { Perfil } from "@/lib/tipos";

export default async function InscricoesPendentes() {
  const supabase = await criarClienteServidor();
  const { data } = await supabase
    .from("perfis")
    .select("*")
    .eq("papel", "aluno")
    .eq("status", "pendente")
    .order("criado_em");

  return (
    <>
      <h1 className="text-xl font-semibold">Inscrições pendentes</h1>
      <ListaAdvogados perfis={(data ?? []) as Perfil[]} vazio="Nenhuma inscrição aguardando análise." />
    </>
  );
}
