# Frontend Architecture Redesign

**Data:** 2026-02-04
**Status:** Aprovado
**Contexto:** Solo dev, PageShell compartilhado entre projetos, app em fase de crescimento + polish

---

## Problema

A aplicação DentAI Pro tem 173 arquivos TypeScript, 21 páginas e funciona bem. Mas três problemas estruturais limitam a velocidade de evolução:

1. **Sem camada de dados.** Chamadas Supabase estão espalhadas em 16+ arquivos. Duplicação de lógica de query, acoplamento direto impossibilita troca de backend ou teste unitário simples.

2. **Complexidade nas páginas sem estrutura intermediária.** Páginas como `NewCase.tsx` têm 25+ chamadas useState. Lógica de negócio, fetching e apresentação vivem no mesmo arquivo. Não há camada entre "estado React cru" e "componente de página."

3. **PageShell instalado mas não adotado.** Apenas Dashboard usa composites. As outras 20 páginas são construídas à mão com shadcn/ui direto. Dois padrões de UI coexistem, duplicando custo de decisão em cada feature nova.

**Causa raiz:** camadas intermediárias ausentes. O app pula de Supabase direto para componente de página.

---

## Arquitetura Alvo

Três camadas finas entre Supabase e a UI. Cada uma é pequena, se paga imediatamente e pode ser adotada incrementalmente.

```
┌─────────────────────────────────────────────┐
│  PageShell Composites (DashboardPage, etc.) │  Design system compartilhado
├─────────────────────────────────────────────┤
│  Page Adapters (por página)                 │  Mapeia domínio → props do composite
├─────────────────────────────────────────────┤
│  Domain Hooks (por feature)                 │  Lógica de negócio + estado
├─────────────────────────────────────────────┤
│  Data Client (um módulo)                    │  Abstração sobre Supabase
├─────────────────────────────────────────────┤
│  Supabase SDK                               │  Infraestrutura
└─────────────────────────────────────────────┘
```

**Regra fundamental:** cada camada só conversa com sua vizinha. Páginas não chamam Supabase. Domain hooks não conhecem PageShell. O data client não conhece React.

---

## Camada 1: Data Client

Wrapper fino sobre Supabase que expõe funções tipadas por entidade. Não é um ORM — apenas funções assíncronas agrupadas por entidade.

### Estrutura

```
src/data/
├── client.ts              # Re-exporta supabase, helpers compartilhados
├── evaluations.ts         # evaluations.list(), .getById(), .create()
├── patients.ts            # patients.list(), .getById(), .upsert()
├── inventory.ts           # inventory.list(), .update()
├── sessions.ts            # sessions.list(), .getByEvaluation()
├── subscriptions.ts       # subscriptions.getCurrent(), .getCredits()
├── drafts.ts              # drafts.load(), .save(), .clear()
└── index.ts               # Barrel export
```

### Padrão por arquivo

```typescript
// src/data/patients.ts
import { supabase } from './client';
import type { Database } from '@/integrations/supabase/types';

type Patient = Database['public']['Tables']['patients']['Row'];

export interface PatientsListParams {
  search?: string;
  sortBy?: 'name' | 'created_at';
  page?: number;
  pageSize?: number;
}

export async function list(params: PatientsListParams) {
  let query = supabase.from('patients').select('*', { count: 'exact' });
  if (params.search) query = query.ilike('name', `%${params.search}%`);
  // paginação, ordenação...
  return query;
}

export async function getById(id: string) {
  return supabase.from('patients').select('*').eq('id', id).single();
}
```

### Benefícios imediatos

- Tipos inferidos do schema Supabase (já gerado)
- Um lugar para corrigir bug de query em vez de caçar em 5 páginas
- Testável sem React — funções assíncronas puras
- Se sair do Supabase, muda apenas estes arquivos

### O que NÃO construir

Nenhum repository pattern genérico, nenhuma hierarquia de classes, nenhum query builder abstrato.

---

## Camada 2: Domain Hooks

Substituem os hooks atuais em `src/hooks/queries/`. A diferença: eles são donos da lógica de negócio, não apenas de data fetching. Consomem o data client e retornam resultados React Query moldados para a UI.

### Estrutura

```
src/hooks/domain/
├── useDashboard.ts         # métricas, sessões recentes, queries paralelas
├── useEvaluations.ts       # lista, agrupamento por sessão, filtro por status
├── usePatients.ts          # lista, busca, ordenação, paginação
├── useInventory.ts         # lista, lógica de importação CSV
├── useSubscription.ts      # créditos, status do plano, verificação canUse
├── useWizardFlow.ts        # estado multi-step, persistência de rascunho
└── index.ts
```

### Diferença chave

Hooks retornam dados moldados para o domínio, não rows crus do Supabase:

```typescript
// src/hooks/domain/useEvaluations.ts
import { useQuery } from '@tanstack/react-query';
import * as evaluations from '@/data/evaluations';

export function useEvaluationsList(filters: EvaluationFilters) {
  return useQuery({
    queryKey: ['evaluations', filters],
    queryFn: () => evaluations.list(filters),
    select: (data) => ({
      sessions: groupBySession(data.rows),
      total: data.count,
      hasIncomplete: data.rows.some(e => !e.completed_at),
    }),
  });
}
```

### useWizardFlow — o maior ganho

Hoje `NewCase.tsx` tem 25+ useState gerenciando progressão de steps, dados de formulário, saves de rascunho, estado de análise e navegação. Este hook consolida tudo em um `useReducer` com ações tipadas: `nextStep`, `setFormData`, `saveDraft`, `restoreDraft`, `reset`.

Não é uma biblioteca de state machine — apenas um reducer com ações tipadas.

### Estratégia de migração

Não reescrever todos os hooks de uma vez. Ao tocar uma página (para adicionar PageShell), extrair seu domain hook ao mesmo tempo. Hooks antigos continuam funcionando até serem substituídos.

---

## Camada 3: Page Adapters + PageShell

Com data client e domain hooks prontos, migrar páginas para composites PageShell se torna mecânico.

### Mapeamento de páginas para composites

| Página | Composite | Esforço | Prioridade |
|--------|-----------|---------|------------|
| **Dashboard** | `DashboardPage` | Baixo (revisão) | Alta — já usa, precisa alinhar ao padrão |
| **Evaluations** | `ListPage` | Baixo | Alta — mais visitada após Dashboard |
| **Patients** | `ListPage` | Baixo | Alta — mesmo padrão de Evaluations |
| **Inventory** | `ListPage` | Baixo | Média |
| **PatientProfile** | `DetailPage` | Médio | Média — tabs, seções |
| **EvaluationDetails** | `DetailPage` | Médio | Média |
| **Profile** | `SettingsPage` | Baixo | Baixa — funciona bem hoje |
| **NewCase** | `LinearFlow` | Alto | Alta — maior ganho de complexidade |
| **Result** | `DetailPage` | Médio | Baixa — UI de protocolo muito custom |

### Regra de fronteira

Page adapters importam de `@pageshell/composites` e de `src/hooks/domain/`. Nunca importam de `src/data/` ou `@supabase`. Isso mantém PageShell reutilizável entre projetos.

### Páginas que ficam custom

Landing, Login, Register, Terms, Privacy, SharedEvaluation. São estáticas, específicas de auth, ou públicas com design único. Nenhum benefício de composite.

---

## Revisão do Dashboard

O Dashboard atual já usa `DashboardPage` composite mas não segue o padrão proposto — chama hooks que acessam Supabase diretamente e tem lógica de negócio inline (banner de créditos, verificação de rascunho, cálculo de firstName).

### Escopo da revisão

1. Extrair queries de `useDashboard.ts` para `src/data/evaluations.ts`, `src/data/patients.ts`, `src/data/sessions.ts`
2. Reescrever `src/hooks/domain/useDashboard.ts` consumindo o data client, computando métricas (pending count, weekly count, completion rate), retornando dados do domínio
3. Simplificar `Dashboard.tsx` para puro adapter: domain hook → DashboardPage props, sem lógica de negócio no arquivo da página
4. Mover lógica de banner de créditos para domain hook `useSubscription`
5. Mover verificação de rascunho para domain hook `useWizardFlow`

Após isso, Dashboard se torna a **implementação de referência** — toda outra migração segue o mesmo padrão de três arquivos: data function → domain hook → page adapter.

---

## Estratégia de Testes

Sem metas de cobertura. Testar três coisas apenas:

### 1. Funções do data client

Testes unitários com Supabase mockado. Funções assíncronas puras, fáceis de testar. Pegam bugs de query antes de chegar em produção.

### 2. Domain hooks

Testar os transforms `select` e lógica de negócio (agrupamento, filtragem, cálculo de status). Usar `renderHook` com query client mockado.

### 3. Fluxos críticos de usuário

Um teste de integração por fluxo: "login → dashboard carrega métricas", "criar avaliação → aparece na lista". Usar Playwright.

### O que NÃO testar

Testes de renderização de componentes, snapshot tests, regressão visual. ROI ruim para solo dev.

---

## Roadmap de Implementação

Cada fase constrói sobre a anterior e entrega valor standalone — pode parar após qualquer fase e o app está melhor.

### Fase 1: Foundation (data client)

1. Criar `src/data/` com client + arquivos por entidade
2. Extrair queries Supabase existentes dos hooks atuais para funções de dados
3. Adicionar testes unitários para funções de dados
4. Nenhuma mudança de UI — hooks existentes continuam funcionando, apenas chamam funções de dados agora

### Fase 2: Dashboard como referência

1. Criar `src/hooks/domain/useDashboard.ts` consumindo data client
2. Mover lógica de créditos/rascunho para fora de Dashboard.tsx, nos domain hooks
3. Simplificar Dashboard.tsx para puro adapter: domain hook → DashboardPage props
4. Estabelecer este como o template para todas as outras páginas

### Fase 3: Trio ListPage (Evaluations, Patients, Inventory)

1. Uma página por vez: data functions → domain hook → ListPage adapter
2. Extrair configs compartilhados para `src/pages/_shared/{entity}/` (columns, filters)
3. Cada página vai de ~300-400 linhas para ~50-80 linhas

### Fase 4: Wizard refactor (NewCase)

1. Criar reducer `useWizardFlow` substituindo 25+ useState
2. Mapear steps para composite `LinearFlow` do PageShell
3. Manter componentes de step como estão — viram conteúdo de slots

### Fase 5: DetailPages (PatientProfile, EvaluationDetails)

1. Domain hooks para views de entidade única
2. Mapear tabs/seções para composite DetailPage
3. Componentes de protocolo permanecem custom — são UI de domínio que não pertence ao PageShell

### Fase 6: Cleanup

1. Deletar `src/hooks/queries/` antigo quando todas as páginas migrarem
2. Remover imports diretos de Supabase de todas as páginas/hooks (lint rule)
3. Adicionar testes Playwright para fluxos críticos

### Páginas fora do escopo

Landing, auth pages (Login, Register, ForgotPassword, ResetPassword), Result (UI de protocolo pesada), SharedEvaluation (público, sem auth), Terms, Privacy, NotFound. Não se beneficiam de PageShell.

---

## Princípios

1. **Cada camada só fala com sua vizinha.** Sem atalhos.
2. **Migração incremental.** Hooks antigos coexistem com novos. Sem big bang.
3. **PageShell não conhece DentAI.** Lógica de domínio fica nos domain hooks, nunca nos composites.
4. **Sem abstrações prematuras.** Data client são funções tipadas, não classes genéricas. Domain hooks são React Query + lógica, não state machines.
5. **Testar o que quebra.** Queries, transforms e fluxos de usuário. Ignorar o resto.
