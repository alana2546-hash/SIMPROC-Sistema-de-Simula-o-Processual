-- SIMPROC fase 1: tabelas, privilégios, funções e RLS.
-- Regra de ouro: aluno só lê o processo em que está vinculado E aprovado;
-- quem escreve é o admin. Tudo garantido aqui, não na tela.

-- ============================================================
-- Sequências
-- ============================================================
create sequence public.oab_numero_seq as integer start with 1 minvalue 1;
create sequence public.processo_seq as integer start with 1 minvalue 1 maxvalue 9999999;

-- ============================================================
-- Tabelas
-- ============================================================
create table public.perfis (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null check (length(trim(nome)) > 0),
  email text not null,
  matricula text not null check (length(trim(matricula)) > 0),
  semestre text not null check (length(trim(semestre)) > 0),
  papel text not null default 'aluno' check (papel in ('aluno', 'admin')),
  status text not null default 'pendente' check (status in ('pendente', 'aprovado', 'recusado')),
  oab_numero integer unique,
  criado_em timestamptz not null default now(),
  decidido_em timestamptz
);

create table public.processos (
  id uuid primary key default gen_random_uuid(),
  numero text not null unique check (numero ~ '^\d{7}-\d{2}\.\d{4}\.8\.99\.0001$'),
  classe text not null check (length(trim(classe)) > 0),
  juizo text not null check (length(trim(juizo)) > 0),
  reu text not null check (length(trim(reu)) > 0),
  imputacao text not null check (length(trim(imputacao)) > 0),
  criado_em timestamptz not null default now()
);

create table public.processo_advogados (
  processo_id uuid not null references public.processos (id) on delete cascade,
  advogado_id uuid not null references public.perfis (id) on delete cascade,
  vinculado_em timestamptz not null default now(),
  primary key (processo_id, advogado_id)
);
create index processo_advogados_advogado_idx on public.processo_advogados (advogado_id);

create table public.movimentacoes (
  id uuid primary key default gen_random_uuid(),
  processo_id uuid not null references public.processos (id) on delete cascade,
  tipo text not null check (tipo in ('despacho', 'decisao', 'intimacao', 'audiencia', 'juntada', 'certidao', 'outro')),
  data date not null default ((now() at time zone 'America/Sao_Paulo')::date),
  texto text not null check (length(trim(texto)) > 0),
  prazo_final date,
  publicada_em timestamptz not null default now(),
  criado_por uuid not null references public.perfis (id),
  constraint prazo_so_em_intimacao check (prazo_final is null or tipo = 'intimacao')
);
create index movimentacoes_processo_idx on public.movimentacoes (processo_id, data desc, publicada_em desc);

create table public.anexos (
  id uuid primary key default gen_random_uuid(),
  movimentacao_id uuid not null references public.movimentacoes (id) on delete cascade,
  nome_arquivo text not null check (length(trim(nome_arquivo)) > 0),
  caminho text not null unique,
  tamanho_bytes integer not null check (tamanho_bytes > 0 and tamanho_bytes <= 20971520),
  criado_em timestamptz not null default now()
);
create index anexos_movimentacao_idx on public.anexos (movimentacao_id);

create table public.acessos (
  processo_id uuid not null references public.processos (id) on delete cascade,
  advogado_id uuid not null references public.perfis (id) on delete cascade,
  ultimo_acesso_em timestamptz not null,
  primary key (processo_id, advogado_id)
);

alter table public.perfis enable row level security;
alter table public.processos enable row level security;
alter table public.processo_advogados enable row level security;
alter table public.movimentacoes enable row level security;
alter table public.anexos enable row level security;
alter table public.acessos enable row level security;

-- ============================================================
-- Privilégios: parte do zero e concede só o necessário.
-- Colunas sensíveis (status, papel, oab_numero, publicada_em...) ficam
-- fora dos GRANTs de UPDATE: nem a API direta consegue alterá-las.
-- ============================================================
revoke all on public.perfis, public.processos, public.processo_advogados,
  public.movimentacoes, public.anexos, public.acessos from anon, authenticated;
revoke all on sequence public.oab_numero_seq, public.processo_seq from anon, authenticated;

grant select on public.perfis to authenticated;
grant update (nome, matricula, semestre) on public.perfis to authenticated;

grant select, insert on public.processos to authenticated;
grant update (classe, juizo, reu, imputacao) on public.processos to authenticated;

grant select, insert, delete on public.processo_advogados to authenticated;

grant select, delete on public.movimentacoes to authenticated;
grant update (tipo, data, texto, prazo_final) on public.movimentacoes to authenticated;

grant select on public.anexos to authenticated;
grant select on public.acessos to authenticated;

-- ============================================================
-- Funções de acesso (security definer: evitam recursão de RLS)
-- ============================================================
create function public.eh_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.perfis
    where id = auth.uid() and papel = 'admin' and status = 'aprovado'
  );
$$;

create function public.advogado_vinculado(p_processo uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.processo_advogados pa
    join public.perfis p on p.id = pa.advogado_id
    where pa.processo_id = p_processo
      and pa.advogado_id = auth.uid()
      and p.status = 'aprovado'
  );
$$;

create function public.pode_ver_processo(p_processo uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.eh_admin() or public.advogado_vinculado(p_processo);
$$;

-- ============================================================
-- Inscrição
-- ============================================================
create function public.criar_perfil_novo_usuario() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.perfis (id, nome, email, matricula, semestre)
  values (
    new.id,
    new.raw_user_meta_data ->> 'nome',
    new.email,
    new.raw_user_meta_data ->> 'matricula',
    new.raw_user_meta_data ->> 'semestre'
  );
  return new;
end;
$$;

create trigger ao_criar_usuario
  after insert on auth.users
  for each row execute function public.criar_perfil_novo_usuario();

create function public.aprovar_inscricao(p_perfil uuid) returns public.perfis
language plpgsql security definer set search_path = '' as $$
declare
  r public.perfis;
begin
  if not public.eh_admin() then
    raise exception 'apenas o admin pode aprovar' using errcode = '42501';
  end if;
  update public.perfis
     set status = 'aprovado',
         oab_numero = case when oab_numero is null then nextval('public.oab_numero_seq') else oab_numero end,
         decidido_em = now()
   where id = p_perfil and papel = 'aluno'
  returning * into r;
  if r.id is null then
    raise exception 'inscrição não encontrada' using errcode = 'P0002';
  end if;
  return r;
end;
$$;

create function public.recusar_inscricao(p_perfil uuid) returns public.perfis
language plpgsql security definer set search_path = '' as $$
declare
  r public.perfis;
begin
  if not public.eh_admin() then
    raise exception 'apenas o admin pode recusar' using errcode = '42501';
  end if;
  update public.perfis
     set status = 'recusado', decidido_em = now()
   where id = p_perfil and papel = 'aluno'
  returning * into r;
  if r.id is null then
    raise exception 'inscrição não encontrada' using errcode = 'P0002';
  end if;
  delete from public.processo_advogados where advogado_id = p_perfil;
  return r;
end;
$$;

-- ============================================================
-- Processos
-- ============================================================
create function public.proximo_sequencial_processo() returns integer
language plpgsql security definer set search_path = '' as $$
begin
  if not public.eh_admin() then
    raise exception 'apenas o admin cria processo' using errcode = '42501';
  end if;
  return nextval('public.processo_seq');
end;
$$;

create function public.exigir_advogado_aprovado() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (
    select 1 from public.perfis
    where id = new.advogado_id and papel = 'aluno' and status = 'aprovado'
  ) then
    raise exception 'só advogado com inscrição aprovada pode ser constituído' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger antes_de_vincular
  before insert on public.processo_advogados
  for each row execute function public.exigir_advogado_aprovado();

create function public.advogados_do_processo(p_processo uuid)
returns table (nome text, oab_numero integer)
language sql stable security definer set search_path = '' as $$
  select p.nome, p.oab_numero
  from public.processo_advogados pa
  join public.perfis p on p.id = pa.advogado_id
  where pa.processo_id = p_processo
    and public.pode_ver_processo(p_processo)
  order by p.nome;
$$;

-- Devolve o acesso ANTERIOR (null se primeiro) e grava o atual numa única
-- chamada. Uma movimentação publicada durante a abertura aparece como nova
-- de novo no acesso seguinte: nunca se perde novidade.
create function public.registrar_acesso(p_processo uuid) returns timestamptz
language plpgsql security definer set search_path = '' as $$
declare
  anterior timestamptz;
begin
  if not public.advogado_vinculado(p_processo) then
    raise exception 'sem acesso ao processo' using errcode = '42501';
  end if;
  select ultimo_acesso_em into anterior
    from public.acessos
   where processo_id = p_processo and advogado_id = auth.uid()
   for update;
  insert into public.acessos (processo_id, advogado_id, ultimo_acesso_em)
  values (p_processo, auth.uid(), now())
  on conflict (processo_id, advogado_id) do update set ultimo_acesso_em = excluded.ultimo_acesso_em;
  return anterior;
end;
$$;

-- Publica movimentação e anexos numa transação. O tamanho e o tipo de cada
-- anexo vêm do próprio Storage, não do navegador.
create function public.publicar_movimentacao(
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

  for v_anexo in select value from jsonb_array_elements(coalesce(p_anexos, '[]'::jsonb)) loop
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

    insert into public.anexos (movimentacao_id, nome_arquivo, caminho, tamanho_bytes)
    values (p_id, v_anexo ->> 'nome_arquivo', v_caminho, v_tamanho);
  end loop;

  return p_id;
end;
$$;

-- Funções chamáveis pela API: só usuário logado.
revoke execute on function
  public.eh_admin(),
  public.advogado_vinculado(uuid),
  public.pode_ver_processo(uuid),
  public.aprovar_inscricao(uuid),
  public.recusar_inscricao(uuid),
  public.proximo_sequencial_processo(),
  public.advogados_do_processo(uuid),
  public.registrar_acesso(uuid),
  public.publicar_movimentacao(uuid, uuid, text, date, text, date, jsonb)
from public, anon;

grant execute on function
  public.eh_admin(),
  public.advogado_vinculado(uuid),
  public.pode_ver_processo(uuid),
  public.aprovar_inscricao(uuid),
  public.recusar_inscricao(uuid),
  public.proximo_sequencial_processo(),
  public.advogados_do_processo(uuid),
  public.registrar_acesso(uuid),
  public.publicar_movimentacao(uuid, uuid, text, date, text, date, jsonb)
to authenticated;

-- ============================================================
-- Políticas (RLS)
-- ============================================================
create policy perfis_select on public.perfis for select to authenticated
  using (id = auth.uid() or public.eh_admin());
create policy perfis_update_proprio on public.perfis for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy processos_select on public.processos for select to authenticated
  using (public.pode_ver_processo(id));
create policy processos_insert on public.processos for insert to authenticated
  with check (public.eh_admin());
create policy processos_update on public.processos for update to authenticated
  using (public.eh_admin()) with check (public.eh_admin());

create policy vinculos_select on public.processo_advogados for select to authenticated
  using (public.pode_ver_processo(processo_id));
create policy vinculos_insert on public.processo_advogados for insert to authenticated
  with check (public.eh_admin());
create policy vinculos_delete on public.processo_advogados for delete to authenticated
  using (public.eh_admin());

create policy movimentacoes_select on public.movimentacoes for select to authenticated
  using (public.pode_ver_processo(processo_id));
create policy movimentacoes_update on public.movimentacoes for update to authenticated
  using (public.eh_admin()) with check (public.eh_admin());
create policy movimentacoes_delete on public.movimentacoes for delete to authenticated
  using (public.eh_admin());

create policy anexos_select on public.anexos for select to authenticated
  using (exists (
    select 1 from public.movimentacoes m
    where m.id = anexos.movimentacao_id and public.pode_ver_processo(m.processo_id)
  ));

create policy acessos_select on public.acessos for select to authenticated
  using (advogado_id = auth.uid() or public.eh_admin());
