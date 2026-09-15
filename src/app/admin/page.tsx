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
  const perfis = (data ?? []) as Perfil[];

  return (
    <div className="grid max-w-4xl gap-5">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Inscrições pendentes</h1>
        <p className="mt-1 text-tinta-suave">
          Ao aprovar, o aluno recebe o número na OAB/SIMPROC e pode ser constituído em um processo.
        </p>
      </div>
      <ListaAdvogados perfis={perfis} vazio="Nenhum pedido de inscrição aguardando análise." />
    </div>
  );
}
