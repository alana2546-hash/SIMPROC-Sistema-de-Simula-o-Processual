"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { publicarMovimentacao } from "@/app/admin/acoes";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TIPOS_MOVIMENTACAO, validarAnexo } from "@/lib/dominio/formularios";
import { criarClienteNavegador } from "@/lib/supabase/navegador";

function tamanho(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
}

export function FormMovimentacao({ processoId, hoje }: { processoId: string; hoje: string }) {
  const router = useRouter();
  const seletor = useRef<HTMLInputElement>(null);
  const [tipo, setTipo] = useState("despacho");
  // Ordem da lista = ordem gravada: o 1º é a peça principal, os demais são anexos.
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [etapa, setEtapa] = useState<string | null>(null);

  function adicionar(evento: ChangeEvent<HTMLInputElement>) {
    const novos = Array.from(evento.target.files ?? []);
    evento.target.value = ""; // permite escolher de novo, inclusive o mesmo arquivo
    for (const arquivo of novos) {
      const problema = validarAnexo(arquivo);
      if (problema) return setErro(problema);
    }
    setErro(null);
    setArquivos((atuais) => [...atuais, ...novos]);
  }

  function remover(indice: number) {
    setArquivos((atuais) => atuais.filter((_, i) => i !== indice));
  }

  function subir(indice: number) {
    setArquivos((atuais) => {
      const lista = [...atuais];
      [lista[indice - 1], lista[indice]] = [lista[indice], lista[indice - 1]];
      return lista;
    });
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const form = evento.currentTarget;
    const dados = new FormData(form);
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
      setArquivos([]);
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

      <div className="grid gap-2 sm:col-span-2">
        <Label htmlFor="anexos">Documentos (PDF, até 20 MB cada)</Label>
        {arquivos.length > 0 && (
          <ol className="grid gap-1.5">
            {arquivos.map((arquivo, i) => (
              <li
                key={`${arquivo.name}-${arquivo.size}-${arquivo.lastModified}-${i}`}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-linha bg-papel px-2.5 py-1.5 text-sm"
              >
                <span className="font-serif text-tinta-suave tabular-nums">{i + 1}.</span>
                <span className="min-w-0 flex-1 break-all">{arquivo.name}</span>
                <span className="text-xs text-tinta-suave">
                  {i === 0 ? "peça principal · " : "anexo · "}
                  {tamanho(arquivo.size)}
                </span>
                {i > 0 && (
                  <button type="button" onClick={() => subir(i)} className="text-xs text-carimbo underline">
                    Subir
                  </button>
                )}
                <button type="button" onClick={() => remover(i)} className="text-xs text-lacre underline">
                  Remover
                </button>
              </li>
            ))}
          </ol>
        )}
        <input
          ref={seletor}
          id="anexos"
          type="file"
          accept="application/pdf"
          multiple
          onChange={adicionar}
          className="hidden"
        />
        <div>
          <Button type="button" variant="outline" onClick={() => seletor.current?.click()}>
            {arquivos.length === 0 ? "Adicionar PDF" : "Adicionar outro PDF"}
          </Button>
        </div>
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
