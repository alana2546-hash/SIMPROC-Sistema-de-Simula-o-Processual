"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { publicarMovimentacao } from "@/app/admin/acoes";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TIPOS_MOVIMENTACAO, validarAnexo } from "@/lib/dominio/formularios";
import { criarClienteNavegador } from "@/lib/supabase/navegador";

export function FormMovimentacao({ processoId, hoje }: { processoId: string; hoje: string }) {
  const router = useRouter();
  const [tipo, setTipo] = useState("despacho");
  const [erro, setErro] = useState<string | null>(null);
  const [etapa, setEtapa] = useState<string | null>(null);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const form = evento.currentTarget;
    const dados = new FormData(form);
    const arquivos = dados.getAll("anexos").filter((a): a is File => a instanceof File && a.size > 0);

    for (const arquivo of arquivos) {
      const problema = validarAnexo(arquivo);
      if (problema) return setErro(problema);
    }
    setErro(null);

    // Os PDFs vão direto do navegador ao Storage; o servidor só registra.
    const supabase = criarClienteNavegador();
    const movimentacaoId = crypto.randomUUID();
    const enviados: string[] = [];
    const anexos: Array<{ nome_arquivo: string; caminho: string }> = [];

    try {
      for (const [i, arquivo] of arquivos.entries()) {
        setEtapa(`Enviando PDF ${i + 1} de ${arquivos.length}…`);
        const caminho = `processos/${processoId}/${movimentacaoId}/${crypto.randomUUID()}.pdf`;
        const { error } = await supabase.storage
          .from("autos")
          .upload(caminho, arquivo, { contentType: "application/pdf", upsert: false });
        if (error) throw new Error(`Falha ao enviar “${arquivo.name}”: ${error.message}`);
        enviados.push(caminho);
        anexos.push({ nome_arquivo: arquivo.name, caminho });
      }

      setEtapa("Publicando…");
      const resultado = await publicarMovimentacao({
        id: movimentacaoId,
        processoId,
        tipo: String(dados.get("tipo") ?? ""),
        data: String(dados.get("data") ?? ""),
        texto: String(dados.get("texto") ?? ""),
        prazo_final: String(dados.get("prazo_final") ?? ""),
        anexos,
      });
      if (resultado.erro) throw new Error(resultado.erro);

      form.reset();
      setTipo("despacho");
      router.refresh();
    } catch (falha) {
      if (enviados.length > 0) await supabase.storage.from("autos").remove(enviados);
      setErro(falha instanceof Error ? falha.message : "Não foi possível publicar.");
    } finally {
      setEtapa(null);
    }
  }

  return (
    <form onSubmit={enviar} className="grid gap-3 sm:grid-cols-2">
      <div className="grid gap-1.5">
        <Label htmlFor="tipo">Tipo</Label>
        <select
          id="tipo"
          name="tipo"
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
        >
          {Object.entries(TIPOS_MOVIMENTACAO).map(([valor, rotulo]) => (
            <option key={valor} value={valor}>
              {rotulo}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="data">Data (na simulação)</Label>
        <Input id="data" name="data" type="date" defaultValue={hoje} required />
      </div>
      <div className="grid gap-1.5 sm:col-span-2">
        <Label htmlFor="texto">Texto</Label>
        <Textarea id="texto" name="texto" rows={5} required />
      </div>
      {tipo === "intimacao" && (
        <div className="grid gap-1.5">
          <Label htmlFor="prazo_final">Prazo final (opcional)</Label>
          <Input id="prazo_final" name="prazo_final" type="date" />
        </div>
      )}
      <div className="grid gap-1.5 sm:col-span-2">
        <Label htmlFor="anexos">PDFs (até 20 MB cada)</Label>
        <Input id="anexos" name="anexos" type="file" accept="application/pdf" multiple />
      </div>
      {erro && (
        <Alert variant="destructive" className="sm:col-span-2">
          <AlertDescription>{erro}</AlertDescription>
        </Alert>
      )}
      <div className="sm:col-span-2">
        <Button type="submit" disabled={etapa !== null}>
          {etapa ?? "Publicar movimentação"}
        </Button>
      </div>
    </form>
  );
}
