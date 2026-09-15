import { criarClienteServidor } from "@/lib/supabase/servidor";

// Abre o PDF por um link assinado de 2 minutos, gerado na hora do clique.
// A RLS decide: quem não pode ver o processo recebe 404.
export async function GET(_request: Request, { params }: RouteContext<"/anexos/[id]">) {
  const { id } = await params;
  const supabase = await criarClienteServidor();

  const { data: anexo } = await supabase.from("anexos").select("caminho").eq("id", id).maybeSingle();
  if (!anexo) return new Response("Não encontrado", { status: 404 });

  const { data, error } = await supabase.storage.from("autos").createSignedUrl(anexo.caminho, 120);
  if (error || !data) return new Response("Não encontrado", { status: 404 });

  return Response.redirect(data.signedUrl, 302);
}
