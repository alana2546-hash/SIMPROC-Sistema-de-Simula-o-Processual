import { LogOut } from "lucide-react";
import { redirect } from "next/navigation";
import { sair } from "@/app/acoes-auth";
import { destinoInicial, obterPerfil } from "@/lib/auth/sessao";
import { estilosEntrada as s } from "../TelaEntrada";

export default async function PaginaAguardando() {
  const perfil = await obterPerfil();
  const destino = destinoInicial(perfil);
  if (destino !== "/aguardando") redirect(destino);

  const recusado = perfil!.status === "recusado";
  return (
    <>
      <div className={s["login-heading"]}>
        <h3>{recusado ? "Pedido de inscrição indeferido" : "Pedido de inscrição em análise"}</h3>
        <p>Olá, {perfil!.nome}.</p>
      </div>

      {recusado ? (
        <p className={s["situacao-recusada"]} role="status">
          A coordenação indeferiu seu pedido. Procure a coordenação da liga para saber o motivo e, se for o caso, pedir
          nova análise.
        </p>
      ) : (
        <p className={s["texto-cartao"]}>
          Assim que a coordenação deferir, seu número na OAB/SIMPROC aparece no topo da tela e você passa a acompanhar o
          processo da sua equipe. Volte a entrar mais tarde.
        </p>
      )}

      <div className={s.signup}>
        <span>Quer entrar com outra conta?</span>
        <form action={sair}>
          <button type="submit" className={s["botao-sair"]}>
            Sair
            <LogOut size={17} aria-hidden />
          </button>
        </form>
      </div>
    </>
  );
}
