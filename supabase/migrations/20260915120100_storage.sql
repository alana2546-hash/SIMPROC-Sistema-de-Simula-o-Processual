-- Bucket privado dos autos: só PDF, até 20 MB (o próprio Storage recusa o resto).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('autos', 'autos', false, 20971520, array['application/pdf'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- processos/{processo_id}/{movimentacao_id}/{arquivo}.pdf → processo_id
-- Qualquer caminho fora desse formato devolve null (ninguém além do admin lê).
create function public.processo_do_caminho(p_nome text) returns uuid
language plpgsql immutable set search_path = '' as $$
declare
  partes text[] := string_to_array(p_nome, '/');
begin
  if coalesce(array_length(partes, 1), 0) <> 4 or partes[1] <> 'processos' then
    return null;
  end if;
  return partes[2]::uuid;
exception when invalid_text_representation then
  return null;
end;
$$;

create policy autos_select on storage.objects for select to authenticated
  using (bucket_id = 'autos' and public.pode_ver_processo(public.processo_do_caminho(name)));

create policy autos_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'autos'
    and public.eh_admin()
    and public.processo_do_caminho(name) is not null
  );

create policy autos_delete on storage.objects for delete to authenticated
  using (bucket_id = 'autos' and public.eh_admin());
