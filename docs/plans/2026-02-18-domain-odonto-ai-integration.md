---
title: Integração domain-odonto-ai
created: 2026-02-18
updated: 2026-02-18
status: published
tags: [type/guide, status/published]
---

# Integração `@parisgroup-ai/domain-odonto-ai`

## Resumo

Pacote complementar ao `@parisgroup-ai/pageshell` com componentes domain-specific para odontologia. Instalado como workspace package em `packages/domain-odonto-ai/`.

## Componentes Integrados

| Componente | Página | Tipo | Descrição |
|---|---|---|---|
| `PageClinicActivityFeed` | Dashboard (PrincipalTab) | Novo | Feed de atividade recente com timeline vertical |
| `PageClinicAlerts` | Dashboard | Novo | Alertas do sistema (créditos baixos, avaliações pendentes) |
| `PagePatientCard` | Patients | Substituição | Card padronizado com avatar, status badge, telefone, última visita |
| `PageOdontogram` | Result | Novo | Visualização do dente no arco dental completo |
| `PageTreatmentTimeline` | PatientProfile | Novo | Timeline visual do histórico de avaliações |
| `PageImageCompare` | SharedEvaluation | Complementar | Comparação lado-a-lado antes/depois (print-only, complementa ComparisonSlider) |

## Decisões

- **Não substituídos**: StatsGrid (sparklines/progress rings superiores), ComparisonSlider (zoom/pan interativo), module cards (gradient/animation custom)
- **PageImageCompare**: `hidden print:block` — visível apenas em impressão, ComparisonSlider interativo mantido para tela
- **PageClinicAlerts**: Sem `dismissible` — sem handler de dismiss implementado, alertas são action-only
- **Timestamps**: ActivityFeed recebe ISO strings e formata internamente via `Intl.RelativeTimeFormat`

## Correções Dark Mode & i18n (pós-integração)

Os componentes do pacote tinham cores hardcoded (light-mode only) e labels em inglês (fallback do `tPageShell`). Correções aplicadas:

| Componente | Correção |
|---|---|
| `PageClinicActivityFeed` | Cores opacity-based (`bg-*/10`), timestamp formatting via `Intl.RelativeTimeFormat`, props `title`/`emptyText` |
| `PageClinicAlerts` | Cores opacity-based (`bg-*/10`, `border-*/20`) |
| `PageOdontogram` | Cores opacity-based (`bg-*/15`, `border-*/30`), props `title`/`conditionLabels` |
| `PageTreatmentTimeline` | Props `statusLabels`/`toothLabel`/`emptyText` |

Consumidores passam strings PT-BR via `t()` com `defaultValue` para todos os labels.

## Instalação

```bash
# Já instalado como workspace package
# packages/domain-odonto-ai/ — exports apontam para source (src/)
# apps/web/package.json: "@parisgroup-ai/domain-odonto-ai": "workspace:^"
```

## Links

- [[../../CLAUDE.md]]
- [[2026-02-18-dsd-quality-audit.md]]
