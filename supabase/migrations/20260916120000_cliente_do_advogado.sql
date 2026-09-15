-- Cliente de cada advogado constituído: um dos investigados do campo "reu"
-- do processo (a aplicação confere). Null = cliente ainda não definido pela
-- coordenação. Vários advogados podem defender o mesmo cliente; cada advogado
-- defende um só cliente por processo (a chave do vínculo não muda).
alter table public.processo_advogados
  add column cliente text check (cliente is null or length(trim(cliente)) > 0);

-- Só a coordenação troca o cliente, e só essa coluna pode mudar.
grant update (cliente) on public.processo_advogados to authenticated;
create policy vinculos_update on public.processo_advogados for update to authenticated
  using (public.eh_admin()) with check (public.eh_admin());

-- Mudar as colunas devolvidas exige recriar a função.
drop function public.advogados_do_processo(uuid);
create function public.advogados_do_processo(p_processo uuid)
returns table (nome text, oab_numero integer, cliente text, eu boolean)
language sql stable security definer set search_path = '' as $$
  select p.nome, p.oab_numero, pa.cliente, pa.advogado_id = auth.uid()
  from public.processo_advogados pa
  join public.perfis p on p.id = pa.advogado_id
  where pa.processo_id = p_processo
    and public.pode_ver_processo(p_processo)
  order by p.nome;
$$;

revoke execute on function public.advogados_do_processo(uuid) from public, anon;
grant execute on function public.advogados_do_processo(uuid) to authenticated;
