-- Ordem dos anexos dentro da movimentação: 0 = peça principal, depois os anexos
-- na ordem em que o admin os listou. Todos são gravados na mesma transação
-- (mesmo criado_em), então a ordem precisa de coluna própria.
alter table public.anexos add column ordem smallint not null default 0;

create or replace function public.publicar_movimentacao(
  p_id uuid,
  p_processo uuid,
  p_tipo text,
  p_data date,
  p_texto text,
  p_prazo_final date,
  p_anexos jsonb default '[]'::jsonb
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_anexo jsonb;
  v_posicao bigint;
  v_caminho text;
  v_prefixo text := 'processos/' || p_processo::text || '/' || p_id::text || '/';
  v_tamanho bigint;
  v_mime text;
begin
  if not public.eh_admin() then
    raise exception 'apenas o admin publica movimentação' using errcode = '42501';
  end if;

  insert into public.movimentacoes (id, processo_id, tipo, data, texto, prazo_final, criado_por)
  values (p_id, p_processo, p_tipo, p_data, p_texto, p_prazo_final, auth.uid());

  for v_anexo, v_posicao in
    select value, ordinality from jsonb_array_elements(coalesce(p_anexos, '[]'::jsonb)) with ordinality
  loop
    v_caminho := v_anexo ->> 'caminho';
    if v_caminho is null
       or left(v_caminho, length(v_prefixo)) <> v_prefixo
       or position('/' in substr(v_caminho, length(v_prefixo) + 1)) > 0 then
      raise exception 'anexo fora da pasta da movimentação: %', v_caminho using errcode = '22023';
    end if;

    select (o.metadata ->> 'size')::bigint, o.metadata ->> 'mimetype'
      into v_tamanho, v_mime
      from storage.objects o
     where o.bucket_id = 'autos' and o.name = v_caminho;

    if v_tamanho is null then
      raise exception 'anexo não encontrado no armazenamento: %', v_caminho using errcode = 'P0002';
    end if;
    if v_mime is distinct from 'application/pdf' then
      raise exception 'anexo não é PDF: %', v_caminho using errcode = '22023';
    end if;

    insert into public.anexos (movimentacao_id, nome_arquivo, caminho, tamanho_bytes, ordem)
    values (p_id, v_anexo ->> 'nome_arquivo', v_caminho, v_tamanho, v_posicao - 1);
  end loop;

  return p_id;
end;
$$;
