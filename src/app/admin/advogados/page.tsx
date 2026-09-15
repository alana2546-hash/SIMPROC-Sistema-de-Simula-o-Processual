import { ListaAdvogados } from "@/app/admin/ListaAdvogados";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import type { Perfil } from "@/lib/tipos";

export default async function Advogados() {
  const supabase = await criarClienteServidor();
  const { data } = await supabase.from("perfis").select("*").eq("papel", "aluno").order("nome");
  const perfis = (data ?? []) as Perfil[];

  return (
    <div className="grid max-w-4xl gap-5">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Advogados inscritos</h1>
        <p className="mt-1 text-tinta-suave">Todos os alunos que pediram inscrição, com a situação de cada um.</p>
      </div>
      <ListaAdvogados perfis={perfis} vazio="Nenhum aluno pediu inscrição ainda." />
    </div>
  );
}
