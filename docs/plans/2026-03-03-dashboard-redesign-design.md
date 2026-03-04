---
title: Dashboard Redesign Design
created: 2026-03-03
status: approved
tags: [type/design, design-os, dashboard]
---

# Dashboard Redesign Design

**Goal:** Redesign the Dashboard prototype in Design OS with premium visual polish (glass, glow, neon) aligned with the wizard, plus structural improvements (CTA hero, KPI banner, 3-tab layout).

**Approach:** A+B — Polish & Elevate visual quality while restructuring information hierarchy.

**Visual Language:** Same as wizard — glass panels, glow orbs, neon text, shimmer borders, card-elevated, section-glow-bg.

---

## Layout Geral

- **Header**: Greeting personalizado (icone hora do dia + "Bom dia, Dr. [Nome]") com badge de creditos
- **3 abas**: Principal | Casos | Insights (usando `wizard-tabs` CSS)
- **Background**: `section-glow-bg` com glow orbs sutis
- **Data**: Dados mocados via `data.json` (standalone preview)

---

## Aba 1: Principal

A tela que o dentista ve primeiro — foco em acao.

### 1. CTA Hero
- Card glass largo com gradiente sutil
- Titulo: "Iniciar Novo Caso" com Sparkles icon
- Subtitulo: "Analise fotos e gere protocolos com IA"
- Botao primario grande com `btn-glow`
- Badge lateral: "2 creditos"

### 2. KPI Banner
- 4 metricas inline num card glass horizontal
- Total Casos | Pacientes | Sessoes Semana | Taxa Conclusao
- Numero grande animado + label pequeno + icone
- Taxa de conclusao com mini progress ring

### 3. Acoes Rapidas
- Grid de 3 cards compactos
- "Meus Pacientes" | "Meu Inventario" | "Configuracoes"
- Icone + label, `hover:shadow-md`, `card-elevated`

### 4. Alertas (condicional)
- Credits low: banner warning com CTA "Ver Planos"
- Draft pendente: card shimmer com "Continuar caso" + botoes

---

## Aba 2: Casos

Lista de sessoes recentes com filtros simples.

### 1. Header
- "Seus Casos" com contador total

### 2. Filtro
- Toggle pill: "Todos" | "Em Progresso" | "Concluidos"

### 3. Draft Pendente (condicional)
- Card com `ai-shimmer-border` no topo
- Info: paciente, dentes, tempo salvo
- Botoes: "Continuar" (primario) + "Descartar" (ghost)

### 4. Lista de Sessoes
- Cards verticais (max 5-8)
- Glass-panel com border-l-4 (verde=concluido, cyan=progresso)
- Conteudo: nome + idade | data relativa
- Badges: tratamentos como chips coloridos (usando `--color-treatment-*`)
- Progress bar: "4/5 protocolos prontos"
- Badge DSD se existir
- Hover: `card-elevated`

### 5. Empty State
- Icone grande + titulo + descricao + CTA "Criar Primeiro Caso"

---

## Aba 3: Insights

Analytics clinicos com charts.

### 1. Period Filter
- Toggle pill: "8 sem" | "12 sem" | "26 sem"
- Glass-panel compacto

### 2. Weekly Trends
- Card glass com area chart
- Avaliacoes/semana, cor primaria com gradient fill
- Tooltip com range da semana

### 3. Grid 2 colunas
- **Esquerda: Distribuicao de Tratamentos**
  - Donut chart com cores `--color-treatment-*`
  - Centro: total, legenda abaixo
- **Direita: Top Resinas**
  - Barras horizontais top 5
  - Badge destaque na #1

### 4. Clinical Summary
- Card glass grid 2x2
- Resina mais usada | Taxa inventario (progress bar)
- Total avaliados | Tempo medio conclusao

### 5. Patient Growth
- Card compacto
- Numero grande: pacientes este mes
- Badge crescimento vs mes anterior (+/- %)

---

## Cross-Cutting

- Todos os cards: `glass-panel`, `rounded-xl`, `focus-visible:ring-2`
- Botoes: `btn-press`, `btn-glow` (primarios), `transition-colors`
- Hover states em cards clicaveis: `card-elevated` ou `hover:shadow-md`
- Treatment colors: usar tokens `--color-treatment-*` definidos em preview-theme.css
- Responsive: 1 col mobile, 2-3 col desktop
- Empty states premium: icone + titulo + descricao + CTA
- Dados mocados via `design/sections/dashboard/data.json`

---

*Aprovado: 2026-03-03*
