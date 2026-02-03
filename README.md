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

## Setup Local

### Pré-requisitos

- Node.js 18+
- npm ou pnpm
- Conta no Supabase

### Instalação

```bash
# Clonar o repositório
git clone <URL_DO_REPO>
cd dentai-pro

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais do Supabase

# Iniciar servidor de desenvolvimento
npm run dev
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

- `npm run dev` - Servidor de desenvolvimento
- `npm run build` - Build de produção
- `npm run preview` - Preview do build
- `npm test` - Executar testes
- `npm run lint` - Verificar código

## Estrutura do Projeto

```
src/
├── components/     # Componentes React reutilizáveis
├── pages/          # Páginas da aplicação
├── hooks/          # Custom hooks
├── lib/            # Utilitários e configurações
├── integrations/   # Integrações (Supabase)
└── types/          # Definições TypeScript

supabase/
└── functions/      # Edge Functions
    ├── analyze-dental-photo/
    ├── recommend-resin/
    ├── recommend-cementation/
    ├── generate-dsd/
    └── _shared/    # Código compartilhado
```

## Licença

Proprietário - Todos os direitos reservados
