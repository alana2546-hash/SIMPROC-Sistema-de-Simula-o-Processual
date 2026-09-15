# SIMPROC — Sistema de Simulação Processual

Painel processual simulado para a liga de Direito Processual Penal. Os alunos pedem inscrição
como advogados; o admin defere, cria processos, constitui as equipes e publica movimentações.
Cada equipe só enxerga o próprio processo, e isso é garantido pelo banco (RLS).

Spec: [`docs/specs/2026-09-15-simproc-fase1-design.md`](docs/specs/2026-09-15-simproc-fase1-design.md)

## Configuração (uma vez)

1. **Supabase**: crie o projeto (região São Paulo).
   - Authentication → Sign In / Providers → Email → desligue **Confirm email**.
2. **`.env.local`** na raiz (nunca versionado), a partir de `.env.example`:
   - `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (Project Settings → API)
   - `SUPABASE_DB_URL`: Connect → **Session pooler**. Se a senha tiver caractere especial,
     use URL-encoding (`@` → `%40`, `#` → `%23`...).
3. `npm install`
4. `npm run db:push`: aplica as migrations.
5. `npm run test:rls`: testes de permissão contra o banco real, cada um em transação com
   ROLLBACK.
6. `npm run dev` e peça inscrição em http://localhost:3000/cadastro com **o seu** e-mail.
7. Torne-se admin (Supabase → SQL Editor):
   ```sql
   update public.perfis set papel = 'admin', status = 'aprovado' where email = 'SEU-EMAIL';
   ```

## Antes de abrir para a turma

Os testes de permissão consomem números das sequências (sequência não volta com rollback).
Zere as sequências **só enquanto não houver aluno aprovado nem processo real**:

```sql
select setval('public.oab_numero_seq', 1, false)
where not exists (select 1 from public.perfis where oab_numero is not null);

select setval('public.processo_seq', 1, false)
where not exists (select 1 from public.processos);
```

## Comandos

| Comando | O quê |
|---|---|
| `npm run dev` | desenvolvimento |
| `npm test` | regras de domínio (CNJ, OAB, prazos, novidades, validações) |
| `npm run test:rls` | permissões no banco real |
| `npm run db:push` | aplica migrations pendentes |
| `npm run build` | build de produção |

## Fora da fase 1 (v2)

Juntada de peças pelo aluno, recuperação de senha por e-mail (hoje o admin redefine pelo painel
do Supabase), edição de movimentação (hoje: excluir e publicar de novo), filtro de advogados,
próximo prazo no cartão do painel, aviso por e-mail.
