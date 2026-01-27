
# Plano de Implementacao: Bloqueadores e Melhorias

## Resumo Geral

Este plano endereca 6 demandas organizadas por prioridade:
- **P0 (Bloqueadores)**: 2 vulnerabilidades de seguranca criticas
- **P1 (Alta Prioridade)**: 4 melhorias de performance e qualidade

---

## P0 - Bloqueadores Restantes

### 1. Adicionar `.env` ao `.gitignore`

**Problema Identificado**
O arquivo `.gitignore` atual **NAO inclui o `.env`**. Isso significa que credenciais sensíveis podem ter sido commitadas se o repositório estiver conectado ao GitHub.

**Situacao Atual do `.gitignore`**
```
node_modules
dist
dist-ssr
*.local
```

**Solucao**
1. Adicionar `.env` e variacoes ao `.gitignore`:
   - `.env`
   - `.env.local`
   - `.env.*.local`

2. Se o repositório for público ou já tiver histórico:
   - Regenerar as credenciais Supabase no painel Cloud
   - Considerar `git filter-branch` para limpar histórico (opcional, complexo)

---

### 2. Corrigir IDOR no Result.tsx

**Problema Identificado**
Na página `Result.tsx`, a query de avaliacao usa apenas o ID do URL sem verificar propriedade:

```typescript
// Linha 132-140 - VULNERAVEL
const { data } = await supabase
  .from('evaluations')
  .select(`*,
    resins:resins!recommended_resin_id (*),
    ideal_resin:resins!ideal_resin_id (*)
  `)
  .eq('id', id)  // Apenas ID, sem user_id!
  .single();
```

Um atacante poderia acessar avaliacoes de outros usuarios simplesmente alterando o ID na URL.

**Locais Afetados**
1. **Fetch inicial** (linha 132-140) - leitura de dados
2. **handleChecklistChange** (linha 208-211) - update de dados

**Solucao**
Adicionar `.eq('user_id', user.id)` em todas as queries:

```typescript
// Fetch - com verificacao de propriedade
const { data } = await supabase
  .from('evaluations')
  .select(`*,
    resins:resins!recommended_resin_id (*),
    ideal_resin:resins!ideal_resin_id (*)
  `)
  .eq('id', id)
  .eq('user_id', user.id)  // ADICIONAR
  .single();

// Update - com verificacao de propriedade
const { error } = await supabase
  .from('evaluations')
  .update({ checklist_progress: indices })
  .eq('id', id)
  .eq('user_id', user.id);  // ADICIONAR
```

**Nota**: RLS já existe na tabela, mas defense-in-depth exige validacao no código também.

---

## P1 - Alta Prioridade

### 3. Paginacao no useDashboardData()

**Problema Identificado**
O hook `useDashboardData()` carrega TODAS as avaliacoes do usuario sem limite:

```typescript
// Linha 67-75 - SEM LIMITE
const { data: evaluationsData } = await supabase
  .from('evaluations')
  .select(`id, created_at, tooth, cavity_class, patient_name, session_id, status`)
  .eq('user_id', user.id)
  .order('created_at', { ascending: false });
```

Com crescimento de dados, isso causará lentidao progressiva.

**Solucao**

1. **Separar métricas de sessoes**:
   - Métricas podem usar queries agregadas (COUNT)
   - Sessoes recentes limitadas a 5 (já existente, mas carrega tudo antes)

2. **Criar query otimizada para métricas**:
```typescript
// Metricas com COUNT em vez de carregar todos
const { count: totalCount } = await supabase
  .from('evaluations')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', user.id);

const { count: completedCount } = await supabase
  .from('evaluations')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', user.id)
  .eq('status', 'completed');

// Contagem semanal
const { count: weeklyCount } = await supabase
  .from('evaluations')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', user.id)
  .gte('created_at', subDays(new Date(), 7).toISOString());
```

3. **Sessoes recentes com LIMIT**:
```typescript
const { data: recentData } = await supabase
  .from('evaluations')
  .select('id, created_at, tooth, patient_name, session_id, status')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false })
  .limit(50); // Carregar apenas o necessario para 5 sessoes
```

---

### 4. Paginacao de Sessoes no PatientProfile

**Problema Identificado**
O hook `usePatientSessions()` carrega todas as sessoes do paciente:

```typescript
// usePatients.ts - SEM LIMITE
const { data } = await supabase
  .from('evaluations')
  .select('session_id, tooth, status, created_at')
  .eq('patient_id', patientId)
  .order('created_at', { ascending: false });
```

**Solucao**

1. **Adicionar paginacao com cursor**:
```typescript
export function usePatientSessions(patientId: string, page: number = 0, pageSize: number = 10) {
  return useQuery({
    queryKey: patientKeys.sessions(patientId, page),
    queryFn: async () => {
      const { data, count } = await supabase
        .from('evaluations')
        .select('session_id, tooth, status, created_at', { count: 'exact' })
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);
      
      // ... grouping logic
      return { sessions, totalCount: count, hasMore: (count || 0) > (page + 1) * pageSize };
    }
  });
}
```

2. **Adicionar botao "Carregar mais" no PatientProfile.tsx**

---

### 5. Integracao Sentry para Monitoramento de Erros

**Situacao Atual**
Nao há monitoramento de erros em producao. Erros sao capturados pelo `ErrorBoundary` mas nao reportados.

**Solucao**

1. **Instalar Sentry SDK**:
```bash
npm install @sentry/react
```

2. **Configurar em `main.tsx`**:
```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  enabled: import.meta.env.PROD,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

3. **Integrar com ErrorBoundary**:
```typescript
componentDidCatch(error: Error, errorInfo: ErrorInfo) {
  Sentry.captureException(error, { extra: errorInfo });
}
```

4. **Adicionar secret `VITE_SENTRY_DSN`** (chave publica, pode ficar no .env)

---

### 6. CI/CD para Rodar Testes Automaticamente

**Situacao Atual**
Nao existe diretório `.github` nem workflows configurados.

**Solucao**

Criar arquivo `.github/workflows/test.yml`:

```yaml
name: Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Type check
        run: npx tsc --noEmit
```

**Benefícios**:
- Testes rodam em cada push/PR
- Bloqueia merge se testes falharem
- Type checking incluído

---

### 7. Code Splitting para Libs Pesadas

**Problema Identificado**
Bibliotecas pesadas sao importadas diretamente:

| Biblioteca | Tamanho (gzip) | Uso |
|------------|----------------|-----|
| recharts | ~45KB | Dashboard (graficos) |
| jspdf | ~80KB | Result (exportar PDF) |
| html2canvas | ~40KB | Result (captura de tela) |

**Solucao**

1. **Lazy import para jspdf e html2canvas** (usados apenas no export PDF):
```typescript
// Antes - import estatico
import { generateProtocolPDF } from '@/lib/generatePDF';

// Depois - import dinamico quando necessario
const handleExportPDF = async () => {
  const { generateProtocolPDF } = await import('@/lib/generatePDF');
  await generateProtocolPDF({...});
};
```

2. **Separar componentes de graficos**:
```typescript
// Antes
import { LineChart, ... } from 'recharts';

// Depois - criar wrapper lazy
const LazyChart = lazy(() => import('@/components/charts/DashboardChart'));
```

3. **Verificar bundle com vite-bundle-visualizer** (opcional para analise)

---

## Secao Tecnica

### Arquivos a Modificar

| Arquivo | Mudanca | Prioridade |
|---------|---------|------------|
| `.gitignore` | Adicionar `.env*` | P0 |
| `src/pages/Result.tsx` | Adicionar `.eq('user_id')` | P0 |
| `src/hooks/queries/useDashboard.ts` | Otimizar queries com COUNT | P1 |
| `src/hooks/queries/usePatients.ts` | Adicionar paginacao em sessions | P1 |
| `src/pages/PatientProfile.tsx` | UI de paginacao | P1 |
| `src/main.tsx` | Inicializar Sentry | P1 |
| `src/components/ErrorBoundary.tsx` | Integrar Sentry.captureException | P1 |
| `.github/workflows/test.yml` | Criar (arquivo novo) | P1 |
| `src/lib/generatePDF.ts` | Export dinamico | P1 |

### Dependencias a Instalar

```bash
npm install @sentry/react
```

### Secrets Necessarios

- `VITE_SENTRY_DSN` - DSN do projeto Sentry (chave publica)

### Ordem de Implementacao Recomendada

1. **Primeiro**: `.gitignore` + IDOR (bloqueadores de seguranca)
2. **Segundo**: Paginacao Dashboard + PatientProfile
3. **Terceiro**: Sentry + CI/CD
4. **Quarto**: Code splitting (otimizacao)

### Testes de Validacao

- **IDOR**: Tentar acessar `/result/{id-de-outro-usuario}` deve retornar "Avaliacao nao encontrada"
- **Paginacao**: Dashboard deve carregar <1s mesmo com 1000+ avaliacoes
- **Sentry**: Forcar erro e verificar no dashboard Sentry
- **CI**: Fazer PR e verificar que testes rodam automaticamente
