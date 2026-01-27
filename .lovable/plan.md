

# Plano de Implementacao: Roadmap de Lancamento

## Visao Geral

Este plano endereca todos os itens do roadmap dividido em 2 fases. Cada tarefa inclui arquivos afetados, complexidade estimada e dependencias.

---

## FASE 1 - BLOQUEADORES (Antes do Lancamento)

### 1.1 Seguranca: Chaves do Supabase e .env

**Status Atual:**
- `.gitignore` NAO inclui `.env`
- Chaves expostas no historico do git

**Acoes Necessarias:**

| Acao | Responsavel |
|------|-------------|
| Adicionar `.env` ao `.gitignore` | Lovable |
| Regenerar chaves do Supabase | Usuario (via Dashboard Cloud) |
| Remover .env do historico git | Usuario (via `git filter-branch` ou BFG) |

**Alteracoes Tecnicas:**

Arquivo: `.gitignore`
```text
# Adicionar ao final:
.env
.env.local
.env.*.local
```

**Nota**: A remocao do historico git e regeneracao de chaves devem ser feitas manualmente pelo usuario apos a alteracao do `.gitignore`.

---

### 1.2 Paginacao em Evaluations, Patients e Inventory

**Problema Atual:**
- Todas as paginas carregam TODOS os registros de uma vez
- Limite do Supabase: 1000 rows por query
- Performance degrada com crescimento de dados

**Solucao: Paginacao Cursor-Based com "Load More"**

**Arquivos Afetados:**

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/Evaluations.tsx` | Adicionar paginacao de 20 itens por pagina |
| `src/pages/Patients.tsx` | Adicionar paginacao de 20 itens por pagina |
| `src/pages/Inventory.tsx` | Adicionar paginacao de 30 itens por pagina |

**Implementacao (Evaluations como exemplo):**

```typescript
// Estado de paginacao
const [page, setPage] = useState(0);
const [hasMore, setHasMore] = useState(true);
const PAGE_SIZE = 20;

// Query com paginacao
const fetchEvaluations = async (pageNumber: number = 0, append: boolean = false) => {
  if (!user) return;
  
  if (!append) setLoading(true);

  const { data, error, count } = await supabase
    .from('evaluations')
    .select('id, created_at, patient_name, tooth, cavity_class, status, session_id', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(pageNumber * PAGE_SIZE, (pageNumber + 1) * PAGE_SIZE - 1);

  if (error) {
    toast.error('Erro ao carregar avaliacoes');
    return;
  }

  const newSessions = groupBySession(data || []);
  
  if (append) {
    setSessions(prev => [...prev, ...newSessions]);
  } else {
    setSessions(newSessions);
  }
  
  setHasMore((count || 0) > (pageNumber + 1) * PAGE_SIZE);
  setLoading(false);
};

// Botao "Carregar mais"
{hasMore && (
  <Button 
    variant="outline" 
    onClick={() => {
      setPage(p => p + 1);
      fetchEvaluations(page + 1, true);
    }}
    className="w-full mt-4"
  >
    Carregar mais
  </Button>
)}
```

---

### 1.3 Corrigir N+1 Query na Pagina de Patients

**Problema Atual (linhas 31-61 de Patients.tsx):**
```typescript
// Query 1: Buscar todos os pacientes
const { data: patientsData } = await supabase.from("patients").select(...);

// Query 2: Buscar TODAS as avaliacoes para calcular stats
const { data: evaluationsData } = await supabase.from("evaluations").select(...);

// Processamento client-side para cada paciente
patientsData.map(patient => {
  evaluationsData.filter(e => e.patient_id === patient.id)...
});
```

**Solucao: Database View ou Aggregated Query**

Opcao A - View no Banco (Recomendado):

```sql
-- Migration: criar view com stats pre-calculados
CREATE OR REPLACE VIEW patient_stats AS
SELECT 
  p.id,
  p.name,
  p.phone,
  p.email,
  p.user_id,
  COUNT(DISTINCT e.session_id) as session_count,
  COUNT(e.id) as case_count,
  COUNT(e.id) FILTER (WHERE e.status = 'completed') as completed_count,
  MAX(e.created_at) as last_visit
FROM patients p
LEFT JOIN evaluations e ON e.patient_id = p.id
GROUP BY p.id, p.name, p.phone, p.email, p.user_id;
```

Opcao B - Single Query com Subquery:

```typescript
// Query unica com agregacao
const { data: patientsWithStats } = await supabase
  .from('patients')
  .select(`
    id, name, phone, email,
    evaluations:evaluations(count)
  `)
  .eq('user_id', user.id)
  .order('name');
```

**Arquivo Afetado:** `src/pages/Patients.tsx`

---

### 1.4 Aumentar Requisito de Senha para 12+ Caracteres

**Problema Atual (auth.ts linhas 9-11 e 20-22):**
```typescript
password: z.string()
  .min(6, 'Senha deve ter pelo menos 6 caracteres')
```

**Solucao: Validacao com Complexidade**

**Arquivo:** `src/lib/schemas/auth.ts`

```typescript
// Novo schema de senha com complexidade
const passwordSchema = z.string()
  .min(12, 'Senha deve ter pelo menos 12 caracteres')
  .max(100, 'Senha muito longa')
  .refine(
    (val) => /[A-Z]/.test(val),
    'Senha deve conter pelo menos uma letra maiuscula'
  )
  .refine(
    (val) => /[a-z]/.test(val),
    'Senha deve conter pelo menos uma letra minuscula'
  )
  .refine(
    (val) => /[0-9]/.test(val),
    'Senha deve conter pelo menos um numero'
  )
  .refine(
    (val) => /[^A-Za-z0-9]/.test(val),
    'Senha deve conter pelo menos um caractere especial (!@#$%^&*)'
  );

// Usar em loginSchema, registerSchema, resetPasswordSchema
export const registerSchema = z.object({
  // ...
  password: passwordSchema,
  // ...
});
```

**Arquivos Afetados:**
- `src/lib/schemas/auth.ts`
- `src/pages/Register.tsx` (exibir requisitos de senha)
- `src/pages/ResetPassword.tsx` (exibir requisitos de senha)

---

### 1.5 Remover localhost do CORS de Producao

**Problema Atual (cors.ts linhas 4-14):**
```typescript
const ALLOWED_ORIGINS = [
  "https://resinmatch-ai.lovable.app",
  "https://id-preview--...",
  // Development origins - EXPOSTOS EM PRODUCAO
  "http://localhost:8080",
  "http://localhost:5173",
  // ...
];
```

**Solucao: Usar Variavel de Ambiente**

**Arquivo:** `supabase/functions/_shared/cors.ts`

```typescript
const PRODUCTION_ORIGINS = [
  "https://resinmatch-ai.lovable.app",
];

const DEVELOPMENT_ORIGINS = [
  "http://localhost:8080",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:8080",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000",
];

// Edge Functions tem acesso a Deno.env
const isDevelopment = Deno.env.get("ENVIRONMENT") !== "production";

const ALLOWED_ORIGINS = isDevelopment 
  ? [...PRODUCTION_ORIGINS, ...DEVELOPMENT_ORIGINS]
  : PRODUCTION_ORIGINS;
```

**Nota:** Adicionar secret `ENVIRONMENT=production` no Supabase.

---

### 1.6 Remover console.log do Codigo de Producao

**Problema Atual:**
- 181 ocorrencias de `console.log` em 6 arquivos
- Arquivos principais: `generate-dsd/index.ts`, `PhotoUploadStep.tsx`

**Solucao: Utility Logger**

**Novo Arquivo:** `src/lib/logger.ts`

```typescript
const isDev = import.meta.env.DEV;

export const logger = {
  log: (...args: any[]) => {
    if (isDev) console.log(...args);
  },
  warn: (...args: any[]) => {
    if (isDev) console.warn(...args);
  },
  error: (...args: any[]) => {
    // Errors sempre logados (para monitoramento)
    console.error(...args);
  },
  info: (...args: any[]) => {
    if (isDev) console.info(...args);
  },
};
```

**Para Edge Functions:** `supabase/functions/_shared/logger.ts`

```typescript
const isDev = Deno.env.get("ENVIRONMENT") !== "production";

export const logger = {
  log: (...args: any[]) => {
    if (isDev) console.log(...args);
  },
  warn: (...args: any[]) => console.warn(...args), // Warnings sempre logados
  error: (...args: any[]) => console.error(...args),
  info: (...args: any[]) => {
    if (isDev) console.info(...args);
  },
};
```

**Arquivos Afetados:**
- `src/lib/logger.ts` (novo)
- `supabase/functions/_shared/logger.ts` (novo)
- `src/components/wizard/PhotoUploadStep.tsx`
- `supabase/functions/generate-dsd/index.ts`
- Outros arquivos com console.log

---

### 1.7 Error Handling Consistente com Feedback ao Usuario

**Status Atual:**
- Erro generico "Erro ao criar caso" em NewCase.tsx (ja parcialmente melhorado)
- Varios `catch` blocks sem feedback ao usuario

**Solucao: Error Handler Centralizado**

**Novo Arquivo:** `src/lib/errorHandler.ts`

```typescript
import { toast } from 'sonner';

interface AppError {
  code?: string;
  message?: string;
  status?: number;
}

const ERROR_MESSAGES: Record<string, string> = {
  '23505': 'Este registro ja existe. Verifique os dados.',
  '23503': 'Erro de referencia. Dados relacionados nao encontrados.',
  'PGRST116': 'Nenhum registro encontrado.',
  'rate_limited': 'Limite de requisicoes. Aguarde alguns minutos.',
  'network_error': 'Erro de conexao. Verifique sua internet.',
  'auth_expired': 'Sessao expirada. Faca login novamente.',
};

export function handleError(error: AppError, fallbackMessage = 'Ocorreu um erro'): string {
  const message = 
    ERROR_MESSAGES[error.code || ''] ||
    error.message ||
    fallbackMessage;
  
  toast.error(message, { duration: 5000 });
  return message;
}

export function handleApiError(error: any, context: string): void {
  const isNetworkError = error?.message?.includes('fetch') || 
                         error?.message?.includes('network');
  
  if (isNetworkError) {
    toast.error('Erro de conexao. Verifique sua internet.');
    return;
  }
  
  handleError(error, `Erro ao ${context}`);
}
```

**Arquivos Afetados:**
- `src/lib/errorHandler.ts` (novo)
- Todos os arquivos com try/catch que usam toast

---

## FASE 2 - ALTA PRIORIDADE (Primeira Semana Pos-Launch)

### 2.1 Implementar React Query para Cache

**Status Atual:**
- React Query ja esta instalado (`@tanstack/react-query`)
- QueryClient ja configurado em App.tsx
- Nenhuma query usa o hook ainda

**Solucao: Migrar Queries Criticas**

**Novo Arquivo:** `src/hooks/queries/useEvaluations.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useEvaluations(userId: string | undefined) {
  return useQuery({
    queryKey: ['evaluations', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('evaluations')
        .select('id, created_at, patient_name, tooth, cavity_class, status, session_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
  });
}

export function usePatients(userId: string | undefined) {
  return useQuery({
    queryKey: ['patients', userId],
    queryFn: async () => { /* ... */ },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}
```

**Arquivos Afetados:**
- `src/hooks/queries/useEvaluations.ts` (novo)
- `src/hooks/queries/usePatients.ts` (novo)
- `src/hooks/queries/useInventory.ts` (novo)
- `src/pages/Evaluations.tsx`
- `src/pages/Patients.tsx`
- `src/pages/Inventory.tsx`
- `src/pages/Dashboard.tsx`

---

### 2.2 Lazy Loading de Rotas

**Status Atual (App.tsx):**
- Todas as rotas sao importadas estaticamente
- Bundle inicial grande

**Solucao: React.lazy + Suspense**

**Arquivo:** `src/App.tsx`

```typescript
import { Suspense, lazy } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy imports
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const NewCase = lazy(() => import('@/pages/NewCase'));
const Inventory = lazy(() => import('@/pages/Inventory'));
const Result = lazy(() => import('@/pages/Result'));
const Evaluations = lazy(() => import('@/pages/Evaluations'));
const EvaluationDetails = lazy(() => import('@/pages/EvaluationDetails'));
const Patients = lazy(() => import('@/pages/Patients'));
const PatientProfile = lazy(() => import('@/pages/PatientProfile'));
const Profile = lazy(() => import('@/pages/Profile'));

// Loading fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Skeleton className="h-[400px] w-full max-w-4xl mx-4" />
  </div>
);

// Uso nas rotas
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Suspense fallback={<PageLoader />}>
        <Dashboard />
      </Suspense>
    </ProtectedRoute>
  }
/>
```

---

### 2.3 Testes Unitarios para Logica Core

**Status Atual:**
- Setup de testes ja configurado (vitest)
- Apenas um teste de exemplo existe

**Solucao: Testes para Validacao e Recomendacao**

**Novos Arquivos:**

```text
src/lib/__tests__/
  - validation.test.ts    (schemas zod)
  - errorHandler.test.ts  (error handling)
  - dateUtils.test.ts     (funcoes de data)
```

**Exemplo:** `src/lib/__tests__/validation.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { registerSchema } from '../schemas/auth';

describe('registerSchema', () => {
  it('should reject password with less than 12 characters', () => {
    const result = registerSchema.safeParse({
      email: 'test@test.com',
      password: 'short',
      confirmPassword: 'short',
      fullName: 'Test User',
      acceptedTerms: true,
    });
    
    expect(result.success).toBe(false);
  });
  
  it('should require uppercase, lowercase, number and special char', () => {
    const result = registerSchema.safeParse({
      email: 'test@test.com',
      password: 'Abc123!@#defg',
      confirmPassword: 'Abc123!@#defg',
      fullName: 'Test User',
      acceptedTerms: true,
    });
    
    expect(result.success).toBe(true);
  });
});
```

---

### 2.4 Habilitar TypeScript Strict Gradualmente

**Status Atual (tsconfig.app.json):**
```json
{
  "strict": false,
  "noImplicitAny": false,
  "noUnusedLocals": false,
  "noUnusedParameters": false
}
```

**Solucao: Habilitar Gradualmente**

**Fase A - Semana 1:**
```json
{
  "noUnusedLocals": true,
  "noUnusedParameters": true
}
```

**Fase B - Semana 2:**
```json
{
  "noImplicitAny": true
}
```

**Fase C - Semana 3:**
```json
{
  "strict": true
}
```

**Arquivos Afetados:**
- `tsconfig.app.json`
- Multiplos arquivos com erros de tipo a corrigir

---

### 2.5 Integrar Monitoramento (Sentry)

**Solucao: Sentry Free Tier**

**Instalacao:**
```bash
npm install @sentry/react
```

**Arquivo:** `src/main.tsx`

```typescript
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.PROD ? 'production' : 'development',
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 0.1, // 10% das transacoes
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0, // 100% quando ha erro
});
```

**Arquivos Afetados:**
- `src/main.tsx`
- `src/components/ErrorBoundary.tsx` (integrar Sentry.captureException)
- Adicionar secret `VITE_SENTRY_DSN` (nao sensivel, pode ir no .env)

---

### 2.6 Adicionar Debounce ao GlobalSearch

**Status Atual (GlobalSearch.tsx linhas 148-155):**
```typescript
// Debounce de 300ms ja implementado
useEffect(() => {
  const timer = setTimeout(() => {
    searchEvaluations(query);
  }, 300);
  return () => clearTimeout(timer);
}, [query, searchEvaluations]);
```

**Status: JA IMPLEMENTADO**

O debounce de 300ms ja existe. Considerar aumentar para 500ms se necessario.

---

### 2.7 Otimizar Imagens

**Status Atual (PhotoUploadStep.tsx):**
- Compressao ja implementada antes do upload
- Converte HEIC para JPEG
- Redimensiona para max 1280px

**Melhoria: Thumbnails para Listas**

**Arquivo:** `src/lib/imageUtils.ts`

```typescript
export async function generateThumbnail(
  base64: string, 
  maxSize: number = 200
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ratio = Math.min(maxSize / img.width, maxSize / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      resolve(canvas.toDataURL('image/jpeg', 0.6));
    };
    img.src = base64;
  });
}
```

**Uso:** Gerar thumbnail ao fazer upload e salvar separadamente para uso em listas.

---

## Resumo de Alteracoes por Arquivo

| Arquivo | Alteracoes |
|---------|------------|
| `.gitignore` | Adicionar `.env` |
| `src/lib/schemas/auth.ts` | Senha 12+ chars com complexidade |
| `src/lib/logger.ts` | Novo - utility logger |
| `src/lib/errorHandler.ts` | Novo - error handling centralizado |
| `src/lib/imageUtils.ts` | Novo - funcao de thumbnail |
| `supabase/functions/_shared/cors.ts` | Remover localhost de producao |
| `supabase/functions/_shared/logger.ts` | Novo - logger para edge functions |
| `src/pages/Evaluations.tsx` | Paginacao + React Query |
| `src/pages/Patients.tsx` | Paginacao + React Query + corrigir N+1 |
| `src/pages/Inventory.tsx` | Paginacao + React Query |
| `src/App.tsx` | Lazy loading de rotas |
| `src/main.tsx` | Integrar Sentry |
| `tsconfig.app.json` | Habilitar strict gradualmente |
| `src/hooks/queries/*.ts` | Novos hooks React Query |
| `src/lib/__tests__/*.ts` | Novos testes unitarios |

---

## Ordem de Execucao Recomendada

### Dia 1 (Criticos de Seguranca)
1. Adicionar `.env` ao `.gitignore`
2. Remover localhost do CORS
3. Aumentar requisito de senha

### Dia 2 (Performance)
4. Implementar paginacao (Evaluations, Patients, Inventory)
5. Corrigir N+1 query em Patients

### Dia 3 (Qualidade de Codigo)
6. Criar logger utility
7. Substituir console.log
8. Criar error handler centralizado

### Semana 1 Pos-Launch
9. Migrar para React Query
10. Implementar lazy loading
11. Adicionar Sentry

### Semana 2 Pos-Launch
12. Criar testes unitarios
13. Habilitar TypeScript strict (fase A)

### Semana 3 Pos-Launch
14. TypeScript strict (fase B e C)
15. Otimizacao de thumbnails

---

## Acoes Manuais do Usuario

| Acao | Instrucoes |
|------|-----------|
| Regenerar chaves Supabase | Cloud View > Settings > API Keys > Regenerate |
| Remover .env do historico git | Usar `git filter-branch` ou ferramenta BFG Repo-Cleaner |
| Adicionar secret ENVIRONMENT | Cloud View > Secrets > Add "ENVIRONMENT" = "production" |
| Configurar Sentry | Criar conta em sentry.io, obter DSN |

