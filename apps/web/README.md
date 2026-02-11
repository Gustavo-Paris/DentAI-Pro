# @dentai/web

Sistema de apoio à decisão clínica odontológica com IA. App principal do monorepo AURIA.

## Funcionalidades

- **Análise de Fotos Dentais**: IA analisa fotografias intraorais e identifica cores VITA
- **Recomendação de Resina**: Sugere protocolo de estratificação personalizado com resinas compatíveis
- **Recomendação de Cimentação**: Indica cimentos e técnicas ideais para cada caso
- **DSD (Digital Smile Design)**: Gera simulações de tratamento com análise de proporções dentais

## Stack

| Tecnologia | Uso |
|-----------|-----|
| React 18 | UI framework |
| TypeScript | Tipagem |
| Vite | Build tool / dev server |
| Tailwind CSS | Styling |
| shadcn/ui + Radix | Component library |
| Supabase | Auth, Database, Edge Functions |
| Google Gemini AI | Análise de fotos e geração de recomendações |
| React Query | Server state management |
| React Hook Form + Zod | Forms e validação |
| React Router DOM | Routing |
| Vitest | Testes |

## Estrutura

```
apps/web/src/
├── components/     # Componentes React reutilizáveis
├── contexts/       # React contexts
├── hooks/          # Custom hooks
├── integrations/   # Integrações (Supabase)
├── lib/            # Utilitários e configurações
├── pages/          # Páginas da aplicação
├── test/           # Setup de testes
└── types/          # Definições TypeScript
```

## Scripts

| Comando | Descrição |
|---------|-----------|
| `pnpm dev` | Servidor de desenvolvimento |
| `pnpm build` | Build de produção |
| `pnpm build:dev` | Build em modo desenvolvimento |
| `pnpm preview` | Preview do build |
| `pnpm test` | Executar testes (Vitest) |
| `pnpm test:watch` | Testes em modo watch |
| `pnpm lint` | Verificar código (ESLint) |
| `pnpm type-check` | Validação TypeScript |

## Variáveis de Ambiente

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
```

## Related

- [AGENTS.md](./AGENTS.md) - Instruções para agentes
- [Root README](../../README.md) - Visão geral do monorepo
