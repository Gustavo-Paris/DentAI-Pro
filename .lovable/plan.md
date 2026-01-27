
# Plano de Melhorias para Lançamento - ResinMatch AI

## Visao Geral do Estado Atual

Apos analise detalhada do codigo, identifiquei o estado atual de cada area:

| Area | Estado Atual | Prioridade para Lancamento |
|------|-------------|---------------------------|
| Loading States | Basico (spinners simples) | ALTA - Impacta UX diretamente |
| Breadcrumbs | Componente existe mas NAO usado | ALTA - Navegacao confusa |
| Modo Offline (PWA) | NENHUMA configuracao | MEDIA - Pode ser pos-lancamento |
| API para Integracoes | Nao existe | BAIXA - Pos-lancamento |
| Validacao com Zod | NENHUMA (tudo manual) | ALTA - Seguranca e UX |
| Error Boundary | NAO EXISTE | ALTA - Crashes mostram tela branca |
| Testes Automatizados | 1 teste vazio | MEDIA - Aumentar cobertura critica |

---

## Fase 1: Essenciais para Lancamento (1-2 dias)

### 1.1 Error Boundary Global

**Problema Atual:** Qualquer erro JavaScript causa tela branca sem feedback ao usuario.

**Solucao:**
Criar `src/components/ErrorBoundary.tsx`:
```typescript
class ErrorBoundary extends Component {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, info) {
    // Log para analytics (futuro)
    console.error('App Error:', error, info);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Algo deu errado</h2>
              <p className="text-muted-foreground mb-4">
                Ocorreu um erro inesperado. Por favor, recarregue a pagina.
              </p>
              <Button onClick={() => window.location.reload()}>
                Recarregar Pagina
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
    return this.props.children;
  }
}
```

**Integracao em `App.tsx`:**
Envolver o router com `<ErrorBoundary>`.

---

### 1.2 Breadcrumbs de Navegacao

**Problema Atual:** Componente `breadcrumb.tsx` existe mas NAO e usado. Usuario fica perdido em paginas profundas.

**Solucao:**
Adicionar breadcrumbs nas paginas:
- `Result.tsx`: Dashboard > Avaliacoes > Avaliacao #123 > Dente 11
- `EvaluationDetails.tsx`: Dashboard > Avaliacoes > Avaliacao #123
- `PatientProfile.tsx`: Dashboard > Pacientes > Joao Silva

**Exemplo de implementacao em `Result.tsx`:**
```tsx
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Link } from 'react-router-dom';

// No header, antes do titulo:
<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink asChild>
        <Link to="/dashboard">Dashboard</Link>
      </BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbLink asChild>
        <Link to={`/evaluation/${evaluation.session_id}`}>Avaliacao</Link>
      </BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>Dente {evaluation.tooth}</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>
```

---

### 1.3 Validacao com Zod em Formularios Criticos

**Problema Atual:** Todos os forms usam validacao manual inline ou nenhuma validacao.

**Solucao - Prioridade Alta:**

**1. Login/Register (seguranca):**
```typescript
// src/lib/schemas/auth.ts
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string()
    .trim()
    .email('Email invalido')
    .max(255, 'Email muito longo'),
  password: z.string()
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
    .max(100, 'Senha muito longa'),
});

export const registerSchema = loginSchema.extend({
  fullName: z.string()
    .trim()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo'),
  cro: z.string()
    .trim()
    .min(4, 'CRO invalido')
    .max(20, 'CRO muito longo'),
});
```

**2. ReviewAnalysisStep (dados clinicos):**
```typescript
// src/lib/schemas/evaluation.ts
export const reviewFormSchema = z.object({
  patientName: z.string().trim().max(100).optional(),
  patientAge: z.coerce.number()
    .min(0, 'Idade invalida')
    .max(120, 'Idade invalida'),
  tooth: z.string().min(1, 'Selecione um dente'),
  budget: z.enum(['economico', 'moderado', 'premium']),
  longevityExpectation: z.enum(['curto', 'medio', 'longo']),
  // ... outros campos
});
```

**Integracao com react-hook-form:**
```typescript
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { loginSchema } from '@/lib/schemas/auth';

const form = useForm({
  resolver: zodResolver(loginSchema),
  defaultValues: { email: '', password: '' },
});
```

---

### 1.4 Loading States Aprimorados

**Problema Atual:** Spinners simples sem contexto durante operacoes longas (DSD ~15s, analise ~10s).

**Solucao:**
Criar componente reutilizavel `LoadingOverlay.tsx`:
```typescript
interface LoadingOverlayProps {
  isLoading: boolean;
  steps?: { label: string; completed: boolean }[];
  message?: string;
  showProgress?: boolean;
  progress?: number;
}

export function LoadingOverlay({ 
  isLoading, 
  steps, 
  message = 'Processando...', 
  showProgress,
  progress 
}: LoadingOverlayProps) {
  if (!isLoading) return null;
  
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <Card className="w-80">
        <CardContent className="p-6 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="font-medium mb-2">{message}</p>
          
          {showProgress && (
            <Progress value={progress} className="mb-4" />
          )}
          
          {steps && (
            <div className="space-y-2 text-left">
              {steps.map((step, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  {step.completed ? (
                    <Check className="w-4 h-4 text-primary" />
                  ) : (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  )}
                  <span className={step.completed ? 'text-foreground' : 'text-muted-foreground'}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

**Aplicar em:**
- `NewCase.tsx` durante submissao
- `DSDStep.tsx` (ja tem mas melhorar)
- `AddTeethModal.tsx` durante geracao de protocolo

---

## Fase 2: Importantes (3-5 dias)

### 2.1 Testes Automatizados - Cobertura Critica

**Estado Atual:** Apenas 1 arquivo `example.test.ts` com teste vazio.

**Estrategia de Testes:**

**Prioridade 1 - Componentes Criticos:**
```typescript
// src/components/wizard/__tests__/ReviewAnalysisStep.test.tsx
describe('ReviewAnalysisStep', () => {
  it('deve pre-preencher form com dados da analise IA', () => {...});
  it('deve permitir selecao de multiplos dentes', () => {...});
  it('deve validar campos obrigatorios antes de avancar', () => {...});
});

// src/pages/__tests__/Login.test.tsx
describe('Login', () => {
  it('deve mostrar erro com credenciais invalidas', () => {...});
  it('deve redirecionar para dashboard apos login', () => {...});
});
```

**Prioridade 2 - Hooks e Utils:**
```typescript
// src/lib/__tests__/dateUtils.test.ts
describe('calculateAge', () => {
  it('deve calcular idade corretamente', () => {...});
  it('deve retornar null para data invalida', () => {...});
});
```

**Meta:** 10-15 testes cobrindo fluxos criticos.

---

### 2.2 PWA - Modo Offline Basico

**Estado Atual:** Nenhuma configuracao PWA. `index.html` sem manifest.

**Solucao:**

**1. Instalar vite-plugin-pwa:**
Adicionar ao `package.json`:
```json
"vite-plugin-pwa": "^0.17.0"
```

**2. Configurar `vite.config.ts`:**
```typescript
import { VitePWA } from 'vite-plugin-pwa';

plugins: [
  react(),
  VitePWA({
    registerType: 'autoUpdate',
    includeAssets: ['favicon.ico', 'robots.txt'],
    manifest: {
      name: 'ResinMatch AI',
      short_name: 'ResinMatch',
      description: 'Plataforma de recomendacao de resinas odontologicas',
      theme_color: '#2563eb',
      background_color: '#ffffff',
      display: 'standalone',
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
    },
    workbox: {
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'supabase-cache',
            expiration: { maxEntries: 50, maxAgeSeconds: 86400 },
          },
        },
      ],
    },
  }),
]
```

**3. Atualizar `index.html`:**
```html
<link rel="manifest" href="/manifest.webmanifest">
<meta name="theme-color" content="#2563eb">
<link rel="apple-touch-icon" href="/icon-192.png">
```

**4. Criar pagina `/install` para instrucoes de instalacao.**

---

## Fase 3: Pos-Lancamento

### 3.1 API para Integracoes

**Escopo:** Criar edge functions para integracao com sistemas de clinica.

**Endpoints Propostos:**
- `GET /api/patients` - Listar pacientes
- `GET /api/evaluations` - Listar avaliacoes
- `POST /api/evaluations` - Criar avaliacao via API
- Autenticacao via API Key (criar tabela `api_keys`)

**Complexidade:** Alta - requer design de API, rate limiting, documentacao.

---

## Cronograma Sugerido

| Dia | Tarefa | Prioridade |
|-----|--------|------------|
| 1 | Error Boundary + Breadcrumbs | ALTA |
| 2 | Validacao Zod (auth + review) | ALTA |
| 3 | Loading States Aprimorados | ALTA |
| 4-5 | Testes Automatizados Criticos | MEDIA |
| 6-7 | PWA Basico | MEDIA |

---

## Arquivos a Criar/Modificar

**Novos Arquivos:**
- `src/components/ErrorBoundary.tsx`
- `src/components/LoadingOverlay.tsx`
- `src/lib/schemas/auth.ts`
- `src/lib/schemas/evaluation.ts`
- `src/pages/__tests__/Login.test.tsx`
- `src/components/wizard/__tests__/ReviewAnalysisStep.test.tsx`
- `public/icon-192.png` e `public/icon-512.png`

**Arquivos a Modificar:**
- `src/App.tsx` - Adicionar ErrorBoundary
- `src/pages/Result.tsx` - Adicionar Breadcrumbs
- `src/pages/EvaluationDetails.tsx` - Adicionar Breadcrumbs
- `src/pages/PatientProfile.tsx` - Adicionar Breadcrumbs
- `src/pages/Login.tsx` - Usar Zod + react-hook-form
- `src/pages/Register.tsx` - Usar Zod + react-hook-form
- `src/pages/NewCase.tsx` - Melhorar loading state
- `vite.config.ts` - Adicionar PWA plugin
- `index.html` - Adicionar meta tags PWA
