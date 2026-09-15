import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const ROTAS_PUBLICAS = ["/entrar", "/cadastro"];

// Renova a sessão do Supabase em toda requisição e manda quem não está
// logado para /entrar, guardando a página de origem.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const logado = Boolean(data?.claims);
  const { pathname, search } = request.nextUrl;
  const publica = ROTAS_PUBLICAS.some((rota) => pathname === rota || pathname.startsWith(`${rota}/`));

  if (!logado && !publica) {
    const url = request.nextUrl.clone();
    url.pathname = "/entrar";
    url.search = pathname === "/" ? "" : `?voltar=${encodeURIComponent(pathname + search)}`;
    const redirecionar = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => redirecionar.cookies.set(cookie));
    return redirecionar;
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
