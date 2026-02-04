# DentAI Pro

Sistema de apoio à decisão clínica odontológica com Inteligência Artificial.

## Funcionalidades

- **Análise de Fotos Dentais**: IA analisa fotografias intraorais e identifica cores VITA
- **Recomendação de Resina**: Sugere protocolo de estratificação personalizado com resinas compatíveis
- **Recomendação de Cimentação**: Indica cimentos e técnicas ideais para cada caso
- **DSD (Digital Smile Design)**: Gera simulações de tratamento com análise de proporções dentais

## Tecnologias

- React 18 + TypeScript
- Vite
- Tailwind CSS + shadcn/ui
- Supabase (Auth, Database, Edge Functions)
- Google Gemini AI
- Turborepo + pnpm (monorepo)

## Estrutura do Projeto

```
dentai-pro/
├── apps/
│   └── web/                    # App principal (Vite + React)
│       └── src/
│           ├── components/     # Componentes React reutilizáveis
│           ├── pages/          # Páginas da aplicação
│           ├── hooks/          # Custom hooks
│           ├── lib/            # Utilitários e configurações
│           ├── integrations/   # Integrações (Supabase)
│           └── types/          # Definições TypeScript
│
├── packages/
│   ├── logger/                 # Logger compartilhado
│   ├── page-shell/             # Barrel package (re-exporta @pageshell/*)
│   ├── pageshell-core/         # Core hooks, utils e types
│   ├── pageshell-primitives/   # Radix UI primitives
│   ├── pageshell-layouts/      # Layout components
│   ├── pageshell-interactions/ # Interactive components
│   ├── pageshell-features/     # Feature components (Layer 4)
│   ├── pageshell-composites/   # Page composites (ListPage, FormPage, etc.)
│   ├── pageshell-shell/        # PageShell facade e query handling
│   ├── pageshell-theme/        # Theme context e hooks
│   ├── pageshell-themes/       # Theme presets (admin, creator, student)
│   └── pageshell-domain/       # Domain-specific UI components
│
├── turbo.json                  # Configuração Turborepo
├── pnpm-workspace.yaml         # Workspace config
└── package.json                # Root package
```

## Setup Local

### Pré-requisitos

- Node.js 18+
- pnpm 9+
- Conta no Supabase

### Instalação

```bash
# Clonar o repositório
git clone <URL_DO_REPO>
cd dentai-pro

# Instalar dependências
pnpm install

# Configurar variáveis de ambiente
cp apps/web/.env.example apps/web/.env
# Edite .env com suas credenciais do Supabase

# Iniciar servidor de desenvolvimento
pnpm dev
```

### Variáveis de Ambiente

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
```

### Supabase Edge Functions

As Edge Functions requerem configuração adicional:

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login no Supabase
supabase login

# Linkar projeto
supabase link --project-ref SEU_PROJECT_REF

# Configurar secrets
supabase secrets set GOOGLE_AI_API_KEY=sua-api-key

# Deploy das functions
supabase functions deploy
```

## Scripts

| Comando | Descrição |
|---------|-----------|
| `pnpm dev` | Servidor de desenvolvimento (todos os apps) |
| `pnpm build` | Build de produção |
| `pnpm test` | Executar testes |
| `pnpm lint` | Verificar código |
| `pnpm type-check` | Validação TypeScript |
| `pnpm clean` | Limpar artefatos de build |

### Scripts por workspace

```bash
# Executar apenas no app web
pnpm -C apps/web dev
pnpm -C apps/web build
pnpm -C apps/web test

# Executar em um package específico
pnpm -C packages/pageshell-core type-check
```

## Packages

| Package | Descrição |
|---------|-----------|
| [`@dentai/web`](apps/web/README.md) | App principal |
| [`@repo/logger`](packages/logger/README.md) | Logger compartilhado |
| [`@repo/page-shell`](packages/page-shell/README.md) | Barrel package PageShell |
| [`@pageshell/core`](packages/pageshell-core/README.md) | Core hooks, utils e types |
| [`@pageshell/primitives`](packages/pageshell-primitives/README.md) | Radix UI primitives |
| [`@pageshell/layouts`](packages/pageshell-layouts/README.md) | Layout components |
| [`@pageshell/interactions`](packages/pageshell-interactions/README.md) | Interactive components |
| [`@pageshell/features`](packages/pageshell-features/README.md) | Feature components |
| [`@pageshell/composites`](packages/pageshell-composites/README.md) | Page composites |
| [`@pageshell/shell`](packages/pageshell-shell/README.md) | PageShell facade |
| [`@pageshell/theme`](packages/pageshell-theme/README.md) | Theme context |
| [`@pageshell/themes`](packages/pageshell-themes/README.md) | Theme presets |
| [`@pageshell/domain`](packages/pageshell-domain/README.md) | Domain UI components |

## Licença

Proprietário - Todos os direitos reservados
