# ToSmile.ai — Brief para Discovery de Usabilidade

**Produto:** ToSmile.ai (nome interno: AURIA)
**Data:** 17/02/2026
**Objetivo:** Fornecer contexto completo para a UX conduzir um discovery de usabilidade do produto.

---

## 1. O Que o Produto Faz

ToSmile.ai e um sistema de apoio a decisao clinica para dentistas, alimentado por IA. O dentista tira uma foto intraoral do paciente, e a IA:

1. **Analisa a foto** — identifica dentes, cavidades, restauracoes, condicoes clinicas
2. **Gera um Digital Smile Design (DSD)** — simulacao visual do resultado do tratamento
3. **Recomenda protocolo de resina** — estratificacao por camadas, marcas, cores, passo-a-passo clinico
4. **Gera relatorio PDF** — documentacao clinica completa para prontuario

O dentista revisa, ajusta o que quiser e gera o caso final com protocolo personalizado.

---

## 2. Publico-Alvo

### Persona Principal: Dentista Clinico Geral
- **Perfil:** Dentista em consultorio proprio ou clinica, atende pacientes do dia-a-dia
- **Dor:** Inseguranca na escolha de materiais (resinas, cores), falta de referencia para protocolos de estratificacao
- **Motivacao:** Ter um "segundo par de olhos" com IA para validar decisoes clinicas
- **Familiaridade tech:** Media — usa WhatsApp, Instagram, apps de banco. Nao e power user
- **Dispositivo:** Celular (predominante) e computador no consultorio
- **Registro profissional:** CRO (Conselho Regional de Odontologia)

### Persona Secundaria: Especialista em Dentistica
- **Perfil:** Dentista com especializacao em restauracoes esteticas
- **Dor:** Quer otimizar tempo de planejamento, validar protocolos complexos
- **Motivacao:** Usar DSD e protocolos avancados de estratificacao
- **Familiaridade tech:** Media-alta

---

## 3. Inventario de Telas

### Telas Publicas (sem login)

| Tela | Rota | Descricao |
|------|------|-----------|
| Landing Page | `/` | Hero, features, depoimentos, precos, FAQ |
| Login | `/login` | Email/senha + Google OAuth |
| Cadastro | `/register` | Nome, CRO, email, senha, aceite de termos |
| Esqueci a Senha | `/forgot-password` | Envio de email de recuperacao |
| Redefinir Senha | `/reset-password` | Nova senha via link do email |
| Termos de Uso | `/terms` | Pagina estatica |
| Privacidade | `/privacy` | Politica LGPD |
| Caso Compartilhado | `/shared/:token` | Visualizacao publica de um caso (somente leitura) |

### Telas Autenticadas (app)

| Tela | Rota | Tipo PageShell | Descricao |
|------|------|----------------|-----------|
| Dashboard | `/dashboard` | DashboardPage | Hub principal: casos recentes, metricas, acoes rapidas, onboarding |
| Novo Caso (Wizard) | `/new-case` | WizardPage | Wizard de 6 passos para criar caso clinico |
| Lista de Avaliacoes | `/evaluations` | ListPage | Todos os casos/sessoes com busca e filtros |
| Detalhes da Avaliacao | `/evaluation/:id` | DetailPage | Sessao completa com todos os dentes, DSD, compartilhar |
| Resultado Individual | `/result/:id` | DetailPage | Protocolo de um dente: materiais, passos, alertas |
| Resultado em Grupo | `/result/group/:sessionId/:fingerprint` | DetailPage | Protocolo unificado para dentes com mesmo tratamento |
| Lista de Pacientes | `/patients` | ListPage | Todos os pacientes com stats |
| Perfil do Paciente | `/patient/:id` | DetailPage | Dados do paciente, historico de sessoes |
| Inventario | `/inventory` | ListPage | Gerenciar colecao de resinas do usuario |
| Perfil do Usuario | `/profile` | DetailPage | Conta, assinatura, creditos, LGPD export/delete |
| Precos | `/pricing` | DetailPage | Planos, comparacao, upgrade |

---

## 4. Fluxos Principais

### 4.1 Fluxo Completo: Novo Caso (Wizard de 6 passos)

```
Passo 1: Upload de Foto
   Usuario tira/envia foto intraoral do paciente.
   Opcao de adicionar fotos extras (lateral, perfil).
   Dois caminhos:
     → "Analisar" (fluxo completo, 6 passos)
     → "Caso Rapido" (4 passos, pula preferencias e DSD)
        ↓
Passo 2: Preferencias do Paciente (somente fluxo completo)
   Nivel de clareamento desejado (natural / leve / moderado / intenso).
   Notas clinicas opcionais.
        ↓
Passo 3: Analise com IA (tela de processamento)
   IA analisa a foto (~50 segundos).
   Mostra progresso animado.
   Se falhar: botao "Tentar novamente" ou "Pular para revisao".
        ↓
Passo 4: DSD — Digital Smile Design (somente fluxo completo)
   Simulacao visual do resultado do tratamento.
   Camadas: antes, depois, gengivoplastia.
   Comparacao lado-a-lado.
   Aprovacao/rejeicao de gengivoplastia.
        ↓
Passo 5: Revisao e Personalizacao
   Resultados da IA apresentados para revisao.
   Selecao/desselecao de dentes.
   Troca de tratamento por dente (resina, porcelana, coroa, etc.).
   Selecao ou cadastro de paciente.
   Observacoes do DSD exibidas.
   Auto-save a cada 30s.
        ↓
Passo 6: Resultado
   Submissao ao backend (gera protocolos por dente).
   Overlay de progresso com etapas.
   Sucesso: dois botoes — "Ver Caso" ou "Recalcular".
```

### 4.2 Caso Rapido (4 passos)
Pula preferencias (Passo 2) e DSD (Passo 4). Usa valores padrao.
Mapeamento: Foto → Analise → Revisao → Resultado.

### 4.3 Visualizacao de Resultado
```
Lista de Avaliacoes → Clica em sessao → Detalhes da Avaliacao
   → Ve todos os dentes da sessao
   → Clica em dente individual → Resultado com protocolo
   → Ou ve protocolo de grupo (dentes com mesmo tratamento)
   → Compartilhar via link publico
   → Exportar PDF
```

### 4.4 Gestao de Pacientes
```
Lista de Pacientes → Clica em paciente → Perfil do Paciente
   → Historico de sessoes
   → Editar dados
   → Criar novo caso para este paciente
```

### 4.5 Inventario de Resinas
```
Inventario → Adicionar resina (marca, linha, cor)
   → Remover resina
   → Inventario influencia recomendacoes da IA
   → Se vazio, IA recomenda do catalogo geral
```

### 4.6 Assinatura e Creditos
```
Pricing → Escolhe plano → Stripe checkout → Volta ao app
Profile → Aba "Assinatura" → Ve creditos, historico de uso
   → Compra pacote avulso de creditos (cartao ou PIX)
   → Programa de indicacao (5 creditos por indicacao)
```

### 4.7 Onboarding (novos usuarios)
```
Primeiro login → Modal de boas-vindas
Dashboard mostra card de onboarding com 3 passos:
   1. Adicionar inventario
   2. Criar primeiro caso
   3. Cadastrar pacientes
Progresso salvo — card desaparece quando completo
Opcao "Caso exemplo" para conhecer o wizard sem upload
```

---

## 5. Sistema de Creditos

| Operacao | Custo |
|----------|-------|
| Analise de foto | 1 credito |
| DSD (simulacao completa) | 2 creditos |
| Recomendacao de resina | 1 credito (por dente) |
| Recomendacao de cimentacao | 1 credito (por dente) |

- **Plano gratuito:** 5 creditos/mes
- **Planos pagos:** Mais creditos + rollover
- **Pacotes avulsos:** Compra extra via cartao ou PIX
- **Bonus:** Indicacoes, promocoes

---

## 6. Navegacao

### Desktop (>=1024px)
- **Sidebar fixa a esquerda** com 5 itens: Home, Avaliacoes, Pacientes, Inventario, Perfil
- Badge de creditos restantes
- Toggle de tema (claro/escuro)
- Logout

### Mobile (<1024px)
- **Header superior fixo** com logo, busca, creditos, tema, logout
- **Bottom navigation fixa** com 5 itens iguais ao desktop
- Safe areas para notch/home indicator

---

## 7. Funcionalidades de IA

| IA | Modelo | O que faz | Tempo |
|----|--------|-----------|-------|
| Analise de Foto | Claude Sonnet 4.5 (visao) | Identifica dentes, cavidades, restauracoes, condicoes | ~50s |
| Classificacao de Sorriso | Claude Haiku 4.5 (dual-pass) | Classifica linha do sorriso (alta/media/baixa) | ~5s |
| Simulacao DSD | Google Gemini 3 Flash | Gera imagem simulada do resultado | ~15s |
| Protocolo de Resina | Claude Haiku 4.5 | Recomenda marca, cor, camadas, passo-a-passo | ~10-15s |
| Protocolo de Cimentacao | Claude Haiku 4.5 | Recomenda cimento, preparo, tempo de cura | ~10s |

---

## 8. Areas de Atencao para o Discovery

### 8.1 Wizard de Novo Caso
- E o fluxo mais critico do produto (core loop)
- 6 passos pode ser longo — avaliar se o usuario se perde
- Passo 3 (analise) demora ~50 segundos — como o usuario percebe a espera?
- Passo 5 (revisao) e denso: muita informacao, muitas opcoes
- O "Caso Rapido" (4 passos) e compreendido? O usuario sabe quando usar?
- Auto-save e draft recovery: o usuario confia que seu trabalho nao foi perdido?

### 8.2 Resultado e Protocolo
- O protocolo de estratificacao e tecnico — o dentista entende?
- As cores recomendadas fazem sentido clinicamente? (feedback recente de especialista)
- Alertas e avisos sao lidos ou ignorados?
- O botao "Recalcular" (novo) e descoberto/usado?
- Compartilhamento de caso: o destinatario entende o que esta vendo?

### 8.3 Mobile
- Predominancia de uso mobile (consultorio, entre pacientes)
- Touch targets sao adequados?
- Wizard no celular: scroll longo vs. telas curtas?
- Upload de foto direto da camera vs. galeria
- Bottom nav oculta conteudo?

### 8.4 Onboarding
- O onboarding de 3 passos e efetivo?
- O caso exemplo da uma boa ideia do produto?
- O modal de consentimento de IA (novo) e lido ou apenas aceito?
- O usuario entende o sistema de creditos logo no inicio?

### 8.5 Inventario
- Poucos usuarios preenchem o inventario — por que?
- O valor de ter inventario (recomendacoes personalizadas) e comunicado?
- A experiencia de adicionar resinas e fluida?

### 8.6 Gestao de Pacientes
- E util ou redundante? (paciente pode ser criado inline no wizard)
- O dentista quer ver historico por paciente?
- Como o dentista identifica pacientes (nome? dente? data?)

### 8.7 Pricing e Creditos
- O modelo de creditos e compreensivel?
- O dentista sabe quantos creditos tem antes de iniciar um caso?
- A barreira de "creditos insuficientes" causa abandono?
- A diferenca entre planos e clara?

---

## 9. Metricas Existentes (PostHog)

- `wizard_started` — Inicio do wizard
- `subscription_viewed` — Visita a tela de precos
- Eventos customizados de progressao do wizard
- Identificacao de usuario pos-login
- Opt-in via cookie consent (LGPD)

**Sugestao para o discovery:** Cruzar dados de PostHog com as hipoteses do discovery para validar quantitativamente os achados qualitativos.

---

## 10. Stack Tecnica (referencia)

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| UI | Tailwind CSS + shadcn/ui + PageShell (design system interno) |
| Backend | Supabase (Auth, DB, Edge Functions em Deno) |
| IA | Claude (Anthropic), Gemini (Google) |
| Pagamentos | Stripe |
| Analytics | PostHog |
| Deploy | Vercel (frontend) + Supabase Cloud (backend) |
| i18n | react-i18next (pt-BR) |

---

## 11. Links Uteis

- **Producao:** https://tosmile.ai
- **Staging:** https://tosmile-ai.vercel.app
- **Supabase Dashboard:** https://supabase.com/dashboard/project/xmivnwpmgpzuoxqhvkts

---

## 12. Perguntas para Guiar o Discovery

1. O dentista consegue criar um caso do inicio ao fim sem ajuda?
2. Em que passo do wizard o dentista mais hesita ou abandona?
3. O resultado (protocolo) e util no dia-a-dia clinico? O dentista usa no consultorio?
4. O DSD agrega valor percebido ou e "so uma imagem bonita"?
5. O dentista voltaria para usar o produto novamente sem incentivo?
6. Como o dentista descreve o produto para um colega?
7. Quais expectativas nao foram atendidas na primeira experiencia?
8. O sistema de creditos e uma barreira ou e aceitavel?
9. O inventario de resinas e percebido como util?
10. O dentista confia nas recomendacoes da IA? Questiona? Ignora?
