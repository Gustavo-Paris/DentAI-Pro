# DSD Enhancements — Design Document

> **Date:** 2026-02-27
> **Status:** Approved
> **Context:** Features de produto para dentistas — pós implementação do face-mockup DSD

---

## Features (em ordem de prioridade)

### 1. Overlay de Proporções DSD

**Goal:** Sobrepor linhas guia (midline, golden ratio, arco do sorriso, terços faciais) sobre a foto do sorriso, permitindo que o dentista visualize as proporções.

**Approach:** Usar dados `toothBounds` já retornados pela análise DSD para posicionar as linhas. SVG overlay sobre a imagem existente no `ComparisonSlider`.

**UX:**
- Toggle button group acima da imagem (ex: "Midline", "Proporção Áurea", "Arco", "Terços")
- Cada toggle liga/desliga uma camada SVG
- Linhas em cores distintas com legenda
- Funciona com zoom/pan existente do ComparisonSlider

**Dados necessários:**
- `toothBounds` (já retornado por `proportions-analysis.ts`)
- Midline: calculada a partir do ponto médio entre 11 e 21
- Golden ratio: largura de cada dente vs proporção 1.618
- Arco do sorriso: curva passando pelas bordas incisais
- Terços faciais: se face photo disponível, linhas horizontais dividindo terços

**Componentes:**
- `ProportionOverlay.tsx` — SVG container com camadas individuais
- `useProportionLines(toothBounds)` — hook que calcula coordenadas das linhas
- Toggle UI integrada ao `DSDSimulationViewer.tsx`

---

### 2. Comparação entre Layers

**Goal:** Permitir que o dentista compare duas simulações DSD lado a lado usando o ComparisonSlider existente.

**Approach:** Modal ou painel inline com seletores de layer (esquerda/direita). Reutiliza ComparisonSlider que já suporta zoom, pan e pinch.

**UX:**
- Botão "Comparar layers" no viewer DSD
- Abre modal com dois dropdowns: Layer A (esquerda) e Layer B (direita)
- Layers disponíveis: Original, Cor, Diastema, Gengiva, Completo, Face Mockup
- ComparisonSlider com as duas imagens selecionadas
- Annotations toggle (mantém funcionalidade existente)

**Componentes:**
- `LayerComparisonModal.tsx` — modal com seletores + ComparisonSlider
- Reutiliza `ComparisonSlider` existente passando imagens diferentes
- Seletores filtram layers disponíveis (só mostra layers que existem no caso)

---

### 3. Relatório PDF Profissional

**Goal:** Gerar PDF com análise completa, proporções, simulação e sugestões para o dentista compartilhar ou arquivar.

**Approach:** Client-side PDF usando infraestrutura existente em `lib/pdf/`. Adiciona seções de DSD ao relatório.

**Conteúdo do PDF:**
- Header com logo + dados do paciente
- Seção 1: Foto original + observações da análise
- Seção 2: Proporções DSD (com overlay renderizado como imagem)
- Seção 3: Simulação (antes/depois lado a lado)
- Seção 4: Sugestões por dente (tabela)
- Seção 5: Protocolos clínicos (se disponíveis)
- Footer com data + disclaimer

**Componentes:**
- Estende `lib/pdf/` existente com seções DSD
- `generateDSDReport(evaluationData)` — função principal
- Botão "Exportar PDF" no `EvaluationDetails`

---

### 4. Compartilhamento WhatsApp

**Goal:** Botão para compartilhar link da avaliação via WhatsApp usando a infraestrutura de sharing existente.

**Approach:** `window.open('https://wa.me/?text=...')` com link compartilhável. Reutiliza `shared_evaluation_links` e `/shared/{token}` existentes.

**UX:**
- Botão WhatsApp ao lado do "Copiar link" existente
- Usa o mesmo token/link compartilhável já gerado
- Texto pré-formatado: "Confira a análise do seu sorriso: {link}"
- Funciona em mobile (abre app) e desktop (abre WhatsApp Web)

**Componentes:**
- Botão com ícone WhatsApp no `EvaluationDetails` (ou `SharedActions`)
- Função `shareViaWhatsApp(link, patientName?)` — monta URL wa.me
- Sem dependência externa

---

## Decisões Arquiteturais

| Decisão | Escolha | Justificativa |
|---------|---------|---------------|
| Posicionamento do overlay | `toothBounds` (Approach A) | Dados já disponíveis, sem custo extra de AI |
| Comparação | ComparisonSlider reutilizado | Já suporta zoom/pan/pinch, evita retrabalho |
| PDF | Client-side (`lib/pdf/`) | Infraestrutura existente, sem edge function |
| WhatsApp | `wa.me` link simples | Zero dependência, funciona em todos devices |

---

*Aprovado em 2026-02-27*
