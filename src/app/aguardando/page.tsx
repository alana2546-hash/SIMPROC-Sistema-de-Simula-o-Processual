import { redirect } from "next/navigation";
import { Cabecalho } from "@/components/Cabecalho";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { destinoInicial, obterPerfil } from "@/lib/auth/sessao";

export default async function PaginaAguardando() {
  const perfil = await obterPerfil();
  const destino = destinoInicial(perfil);
  if (destino !== "/aguardando") redirect(destino);

  const recusado = perfil!.status === "recusado";
  return (
    <>
      <Cabecalho perfil={perfil} inicio="/aguardando" />
      <main className="mx-auto w-full max-w-md px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              {recusado ? "Pedido de inscrição indeferido" : "Seu pedido de inscrição está em análise"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-neutral-700">
            {recusado
              ? "Procure a coordenação da liga."
              : "Assim que a coordenação deferir, seu número de inscrição aparece aqui e você passa a acompanhar o processo da sua equipe."}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
