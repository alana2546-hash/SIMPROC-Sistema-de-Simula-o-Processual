# SIMPROC — Sistema de Simulação Processual · Fase 1

**Data:** 2026-09-15
**Status:** design aprovado em conversa; aguarda revisão desta spec
**Público:** alunos da liga de Direito Processual Penal, que simulam a atuação como advogados

## 1. Objetivo

Um painel processual em que o professor (admin) conduz processos penais simulados e os
alunos, inscritos como advogados, acompanham o processo da sua equipe, como fariam num
sistema de tribunal.

A fase 1 cobre três coisas:

1. o aluno pede inscrição como advogado e o admin defere;
2. o admin cria processos, constitui as equipes e publica movimentações com texto, PDFs e prazo;
3. o aluno acompanha a linha do tempo do processo dele, com marca de novidade e prazos em aberto.

A juntada de peças pelo aluno fica para a fase 2, mas o modelo de dados já a comporta.

## 2. Decisões tomadas

| Tema | Decisão |
|---|---|
| Vinculação | 1 processo por equipe; uma equipe não vê o processo da outra |
| Entrada no processo | O aluno se cadastra → fica pendente → o admin aprova e vincula ao processo |
| Identidade | Número OAB fictício gerado na aprovação: `OAB/SIMPROC 0042` |
| Movimentação | Tipo + data simulada + texto + PDFs + prazo final manual (só em intimação) |
| Aviso ao aluno | Nada é enviado; marca de "novo" no painel e bloco "Prazos em aberto" |
| Onde mora | App próprio em `D:\simproc`, repositório git próprio, fora do Metav2 |
| Infra | Conta nova do Supabase e da Vercel, ligadas ao outro GitHub do Aldemir |
| Repositório | https://github.com/alana2546-hash/SIMPROC-Sistema-de-Simula-o-Processual (**público**) |

## 3. Arquitetura

- **Next.js (App Router) + TypeScript.** As telas são Server Components e as escritas do
  admin são Server Actions. Não há API separada nem react-router.
- **Tailwind + shadcn/ui.**
- **Supabase:** login com e-mail e senha, sessão em cookie via `@supabase/ssr`, Postgres com
  RLS e bucket privado `autos` para os PDFs.
- **Vercel** para o deploy. Endereço inicial: subdomínio gratuito (ex.: `simproc.vercel.app`).
- A `service_role key` só é usada no servidor e só onde a RLS não resolve (ex.: apagar os PDFs
  de uma movimentação excluída). Nunca chega ao navegador.
- **O repositório é público.** Chaves só em `.env.local` (no `.gitignore`) e nas variáveis de
  ambiente da Vercel. Nada de dado real de cliente ou processo real em código, teste ou fixture.

### Estrutura de pastas

```
D:\simproc
├── src/app/              telas do aluno e do /admin
├── src/lib/              funções puras testáveis (nº CNJ, OAB, prazo, "novo")
├── supabase/migrations/  tabelas, RLS, funções SQL, políticas do Storage
├── supabase/tests/       testes de permissão em SQL
└── docs/specs/           esta spec
```

### Configuração de login

- **Confirmação por e-mail desligada.** A aprovação do admin já é o controle de acesso.
  Além disso, o envio de e-mail embutido do Supabase tem limite por hora muito baixo e
  travaria o cadastro de uma turma inteira no mesmo dia. O valor exato é conferido na
  implementação.
- **Recuperação de senha** usa o e-mail embutido do Supabase, porque o volume é baixo.

## 4. Papéis e permissões

A regra vale **no banco (RLS)**, não só na tela.

| Papel | Lê | Escreve |
|---|---|---|
| Pendente / recusado | o próprio perfil | nome, matrícula e semestre do próprio perfil |
| Advogado aprovado | o próprio perfil; os processos em que está vinculado, com movimentações, anexos, advogados constituídos e o próprio acesso | o próprio registro de acesso; nome, matrícula e semestre do próprio perfil |
| Admin | tudo | tudo |

- O admin é definido **uma única vez por SQL** (`papel = 'admin'`, `status = 'aprovado'`), sem
  tela para isso.
- A leitura do advogado exige **as duas condições**: estar vinculado **e** ter
  `status = 'aprovado'`. Recusar também remove os vínculos (§6), mas a política não depende disso.
- Aprovar e recusar só é possível por função SQL `SECURITY DEFINER`, que confere se quem
  chama é admin.
- `status`, `papel` e `oab_numero` **não podem ser alterados pelo próprio aluno**, nem
  chamando a API direto. Isso é garantido por privilégio de coluna e/ou trigger, e não
  apenas por omissão na interface.

## 5. Modelo de dados

### `perfis`
Um registro por usuário (`id` = `auth.users.id`), criado por trigger em `auth.users` no
cadastro. O trigger lê nome, matrícula e semestre do `raw_user_meta_data` enviado no `signUp`.
Se faltar algum desses campos, o cadastro falha inteiro; o formulário valida antes de enviar.

| Coluna | Tipo | Regra |
|---|---|---|
| `id` | uuid PK | FK para `auth.users` |
| `nome` | text | obrigatório |
| `email` | text | copiado do auth |
| `matricula` | text | obrigatório |
| `semestre` | text | obrigatório |
| `papel` | text | `aluno` \| `admin`, padrão `aluno` |
| `status` | text | `pendente` \| `aprovado` \| `recusado`, padrão `pendente` |
| `oab_numero` | int unique null | preenchido na **primeira** aprovação, a partir de uma sequência |
| `criado_em`, `decidido_em` | timestamptz | |

- O número OAB vem de uma **sequência do Postgres** e **nunca é reaproveitado**.
- Quem foi aprovado, recusado e depois aprovado de novo **mantém o número original**.
- Exibição: `OAB/SIMPROC ` + número com 4 dígitos (`0042`); a partir de 10.000, sem zeros à esquerda.

### `processos`

| Coluna | Tipo | Regra |
|---|---|---|
| `id` | uuid PK | |
| `numero` | text unique | gerado ao criar; formato CNJ com tribunal inexistente |
| `classe` | text | ex.: Ação Penal – Procedimento Comum Ordinário |
| `juizo` | text | ex.: 1ª Vara Criminal da Comarca de SIMPROC |
| `reu` | text | nome fictício |
| `imputacao` | text | ex.: art. 157, §2º, II, do CP |
| `criado_em` | timestamptz | |

**Número CNJ fictício:** `NNNNNNN-DD.AAAA.J.TR.OOOO`, com `J=8` e `TR=99` (tribunal que não
existe), `AAAA` = ano de criação, `OOOO=0001` e `NNNNNNN` sequencial. `DD` é o dígito
verificador do padrão CNJ (Resolução 65/2008: módulo 97, base 10). Exemplo de formato:
`0000042-DD.2026.8.99.0001`.

### `processo_advogados`

| Coluna | Tipo | Regra |
|---|---|---|
| `processo_id` | uuid FK | PK composta |
| `advogado_id` | uuid FK → `perfis` | PK composta; só aceita perfil `aprovado` |
| `vinculado_em` | timestamptz | |

O banco permite um aluno em mais de um processo (não custa nada). A interface lista todos.

### `movimentacoes`

| Coluna | Tipo | Regra |
|---|---|---|
| `id` | uuid PK | |
| `processo_id` | uuid FK | |
| `tipo` | text | `despacho` \| `decisao` \| `intimacao` \| `audiencia` \| `juntada` \| `certidao` \| `outro` |
| `data` | date | data **dentro da simulação**, escolhida pelo admin; padrão hoje (Brasília) |
| `texto` | text | obrigatório |
| `prazo_final` | date null | só permitido quando `tipo = 'intimacao'` (CHECK) |
| `publicada_em` | timestamptz | hora real da publicação; **só** alimenta a marca de "novo"; não aparece para o aluno |
| `criado_por` | uuid FK → `perfis` | na fase 2, distingue juntada do aluno de ato do admin |

- O admin pode **editar** (tipo, data, texto, prazo) e **excluir**. A edição não altera
  `publicada_em`, então não gera nova marca de "novo".
- Ordem da linha do tempo: `data` desc, depois `publicada_em` desc.

### `anexos`

| Coluna | Tipo | Regra |
|---|---|---|
| `id` | uuid PK | |
| `movimentacao_id` | uuid FK, cascade | |
| `nome_arquivo` | text | nome original, exibido ao aluno |
| `caminho` | text unique | `processos/{processo_id}/{movimentacao_id}/{uuid}.pdf` |
| `tamanho_bytes` | int | ≤ 20 MB |
| `criado_em` | timestamptz | |

- Bucket `autos` **privado**, configurado com `allowed_mime_types = ['application/pdf']` e
  `file_size_limit = 20 MB`. O próprio Storage recusa o que estiver fora disso.
- A política do Storage libera leitura só para o admin e para advogados vinculados (e
  aprovados) ao `processo_id` do caminho, a mesma regra das tabelas. Escrita e remoção só
  para o admin.
- O download usa **URL assinada de curta duração** (poucos minutos), gerada no servidor.

### `acessos`

| Coluna | Tipo | Regra |
|---|---|---|
| `processo_id` | uuid FK | PK composta |
| `advogado_id` | uuid FK | PK composta |
| `ultimo_acesso_em` | timestamptz | |

## 6. Regras de negócio

### Marca de "novo"
Ao abrir `/processos/[id]`:
1. o sistema lê `ultimo_acesso_em` (se não houver registro, **tudo** conta como novo);
2. marca como **novo** cada movimentação com `publicada_em > ultimo_acesso_em`;
3. só **depois** de ler, grava `ultimo_acesso_em = agora`.

No painel, a contagem de novidades por processo usa a mesma regra, **sem** gravar acesso.

### Prazos em aberto
Bloco no topo do processo, com intimações que têm `prazo_final`:
- **vence hoje**: `prazo_final = hoje`
- **vence em N dias**: `prazo_final > hoje`
- **vencido**: `prazo_final < hoje`, exibido em vermelho **por 7 dias** após o vencimento e
  depois só na linha do tempo

"Hoje" é sempre a data em **America/Sao_Paulo**, nunca a data UTC do servidor.

### Constituição
- Só perfil `aprovado` pode ser vinculado.
- Desvincular tira o acesso imediatamente, pela RLS e porque o link assinado expira.
- Recusar um perfil já vinculado **também** remove os vínculos dele, na mesma função.

## 7. Telas

### Aluno
| Rota | Conteúdo |
|---|---|
| `/cadastro` | nome, e-mail, senha, matrícula, semestre → redireciona para `/aguardando` |
| `/entrar` | login; aceita `?voltar=` para retornar à página de origem |
| `/esqueci-senha` | pede o e-mail e dispara a recuperação pelo Supabase |
| `/redefinir-senha` | destino do link do e-mail; define a nova senha |
| `/aguardando` | pendente: "Seu pedido de inscrição está em análise". Recusado: "Pedido de inscrição indeferido. Procure a coordenação da liga." |
| `/painel` | "Meus processos": cartões com número, réu, imputação, nº de novidades e próximo prazo. Sem vínculo: "Você ainda não foi constituído em nenhum processo." |
| `/processos/[id]` | cabeçalho (número, classe, juízo, réu, imputação, advogados constituídos com OAB) → Prazos em aberto → linha do tempo (data, tipo, texto, PDFs, marca de novo) |

Um usuário pendente ou recusado que tente abrir `/painel` ou `/processos/*` é mandado para
`/aguardando`.

### Admin
| Rota | Conteúdo |
|---|---|
| `/admin` | inscrições pendentes com aprovar/recusar; aprovar gera o número OAB na hora |
| `/admin/advogados` | todos os inscritos, com filtro por status; permite aprovar quem foi recusado |
| `/admin/processos` | lista + criar processo (número CNJ gerado ao salvar) |
| `/admin/processos/[id]` | editar dados; incluir/desvincular advogados; nova movimentação (tipo, data, texto, prazo só em intimação, PDFs); linha do tempo com editar/excluir |

Não-admin que acesse `/admin/*` recebe 404.

### Visual
Sóbrio, com cara de sistema de tribunal, mas legível. **Funciona bem no celular (~400 px)**,
porque é lá que o aluno vai conferir o processo. O acabamento visual é decidido na
implementação.

## 8. Fluxos com cuidado especial

### Publicar movimentação com PDFs
**Restrição que define o fluxo:** a Vercel limita o corpo de uma requisição a uma função em
**4,5 MB** (e a Server Action do Next.js tem limite padrão de 1 MB). Um PDF de 20 MB **não
pode passar pelo servidor**. Por isso, os arquivos vão **do navegador direto para o Storage**,
com a sessão do admin, e o servidor só registra.

1. **Navegador:** valida tipo (PDF) e tamanho (≤ 20 MB) e gera o `movimentacao_id` (uuid).
2. **Navegador → Storage:** envia cada PDF para
   `processos/{processo_id}/{movimentacao_id}/{uuid}.pdf`. A política do Storage só aceita
   escrita do admin, e o bucket recusa não-PDF e arquivo > 20 MB.
3. **Server Action:** valida tipo, data, texto obrigatório e `prazo_final` só em intimação;
   confere que cada caminho informado existe no Storage, sob a pasta daquela movimentação,
   e usa o tamanho que o Storage registrou, não o informado pelo navegador.
4. **Server Action → função SQL:** grava movimentação e anexos **numa única transação**.
5. **Falha no passo 2, 3 ou 4:** o navegador pede a remoção dos arquivos já enviados e mostra
   o erro com o formulário ainda preenchido.

**Resíduo aceito:** se o navegador for fechado **no meio** do envio, arquivos já enviados
podem ficar numa pasta sem movimentação correspondente. Eles não aparecem para ninguém,
porque nenhuma linha de `anexos` aponta para eles, e o custo de espaço é irrelevante.
Movimentação apontando para anexo inexistente continua impossível.

### Excluir movimentação
Apaga os arquivos do Storage e depois a linha (anexos em cascade). Se a remoção no Storage
falhar, **não** apaga a linha e mostra o erro.

## 9. Situações de erro

| Situação | Comportamento |
|---|---|
| Aluno abre processo alheio pela URL | 404, sem revelar que o processo existe |
| Não-admin em `/admin/*` | 404 |
| Sessão expirada | `/entrar?voltar=<rota>` |
| Arquivo não-PDF ou > 20 MB | recusado na tela **e** pelo próprio bucket do Storage |
| Aluno desvinculado com a página aberta | a próxima ação ou download falha; o link assinado expira |
| Tentativa de excluir processo | não existe na fase 1; se precisar, por SQL |

## 10. Testes

### 10.1 Permissões (SQL, `supabase/tests/`)
Rodam no projeto real **dentro de transação com `ROLLBACK`**, simulando usuários com
`set local role authenticated` e `request.jwt.claims`. Não deixam dados. O Supabase local
não é usado porque o Docker não está instalado na máquina.

Casos obrigatórios:
- aluno A não lê processo, movimentação, anexo, `processo_advogados` nem `acessos` do processo de B;
- pendente e recusado não leem nenhum processo;
- aluno não insere, altera nem apaga movimentação, anexo, processo ou vínculo;
- aluno não altera o próprio `status`, `papel` ou `oab_numero`;
- aluno não executa as funções de aprovar e recusar;
- aluno só grava `acessos` para processo em que está vinculado;
- política do Storage: aluno A não lê objeto sob `processos/{processo de B}/`, e aluno não
  escreve nem remove objeto (se o Supabase bloquear inserção direta em `storage.objects` no
  teste SQL, este caso passa para o teste no navegador, §10.3);
- admin lê e escreve tudo;
- vincular perfil não aprovado falha;
- `prazo_final` em movimentação que não é intimação falha (CHECK);
- aprovar duas vezes mantém o mesmo `oab_numero`.

### 10.2 Funções puras (Vitest, `src/lib/`)
- dígito verificador CNJ, conferido contra **números reais já públicos** (ex.: processos
  citados em acórdãos publicados de tribunais). **Números de processos de clientes nunca entram
  no repositório**, que é público; se servirem de conferência, a checagem é feita localmente,
  sem commit;
- formato OAB (`0042`, `9999`, `10000`);
- status do prazo: vence hoje, faltam N dias, vencido há até 7 dias, vencido há mais de 7;
  inclui a **virada do dia em Brasília** (ex.: 23h30 de Brasília = 02h30 UTC do dia seguinte);
- regra do "novo": sem acesso anterior, publicada antes, depois e no mesmo instante.

### 10.3 Navegador, com dados reais
O admin, dois alunos em equipes diferentes e um terceiro pendente percorrem o fluxo completo:
- cadastro → aprovação → vínculo;
- publicação com PDF e prazo;
- marca de novo;
- **tentativa de abrir o processo e o PDF da outra equipe**;
- desvinculação;
- teste no celular.

## 11. Fora da fase 1

- juntada de peças pelo aluno (**fase 2**; `criado_por` e `anexos` já comportam)
- cálculo automático de prazo e registro de ciência
- aviso por e-mail
- juiz, MP ou outro professor como usuário; mais de um admin
- audiência com agenda, mensagens, notas ou avaliação
- exclusão de processo pela interface
- domínio próprio

## 12. Pré-requisitos de implementação

- Criar a conta nova do Supabase e da Vercel com o outro GitHub (Aldemir).
- Definir, em `D:\simproc`, o nome e o e-mail de autor dos commits que correspondem à conta
  GitHub dona do repositório, **antes do primeiro push**.
- Push para o GitHub só com autorização explícita do Aldemir.
- Conferir no painel do Supabase o limite de e-mails por hora e a opção de desligar a
  confirmação por e-mail.
