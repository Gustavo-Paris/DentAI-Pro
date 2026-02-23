---
title: Design Critic Skill — Design Document
created: 2026-02-23
updated: 2026-02-23
status: approved
tags: [type/design, status/approved]
---

# Design Critic Skill

> Skill de designer sr. extremamente critico que analisa a aplicacao web em 5 dimensoes, identifica problemas visuais e aplica correcoes automaticamente.

## Decisoes

- **Escopo**: Consistencia visual + UX + Modernidade (3 dimensoes, 5 pilares)
- **Modos**: Full Audit (todas as paginas) + Targeted Review (pagina especifica)
- **Acao**: Full auto-fix (aplica todas as correcoes P0/P1/P2)
- **Visual**: Codigo + screenshots via Playwright (desktop 1440px + mobile 390px)
- **Benchmark**: SaaS premium (Linear, Vercel, Stripe) + Healthcare/MedTech
- **Abordagem**: Skill monolitica unica

## Identidade

**Nome**: `design-critic`
**Persona**: Designer senior extremamente critico e exigente. Referencia SaaS premium (Linear, Vercel, Stripe) e MedTech de ponta. Nao aceita "bom o suficiente" — busca excelencia visual.

**Triggers**:
- `design audit`, `design review`, `visual audit`, `auditoria design`
- `design critic`, `critica visual`, `design quality`
- `review visual`, `UI review`, `UX review`
- `modernizar`, `modernize`, `refinar visual`, `polish UI`
- `design consistency`, `consistencia visual`

**Modos**:
- **Full Audit**: sem argumentos ou `audit all` — varre todas as paginas
- **Targeted Review**: `review [PageName]` — foca em uma pagina/fluxo especifico

## Framework de Avaliacao (5 Pilares)

Cada pagina/componente avaliado em 5 pilares, score 0-10:

| Pilar | Peso | O que avalia |
|-------|------|-------------|
| **Visual Consistency** | 25% | Tokens, cores, espacamentos, tipografia, sombras |
| **Information Hierarchy** | 25% | Hierarquia visual, contraste, agrupamento, escaneabilidade |
| **Interaction Quality** | 20% | Estados (hover, focus, loading, empty, error), transitions, feedback |
| **Spatial Design** | 15% | Whitespace, padding, grid, alinhamento, breathing room |
| **Polish & Craft** | 15% | Micro-detalhes: bordas, radius, sombras, gradientes, animacoes sutis |

**Scoring**:
- 9-10: Nivel Linear/Stripe — perfeito
- 7-8: Profissional — poucos ajustes
- 5-6: Funcional mas generico — precisa refinamento
- 3-4: Abaixo do padrao — redesign necessario
- 0-2: Problema serio — bloqueador

**Score final**: Media ponderada dos 5 pilares.

## Fluxo de Execucao

```
1. RECONNAISSANCE
   +-- Glob: mapear paginas (src/pages/**/*.tsx)
   +-- Glob: mapear componentes de dominio (packages/domain-odonto-ai/)
   +-- Read: tailwind.config, theme tokens, CSS globals

2. SCREENSHOT CAPTURE (Playwright)
   +-- Navegar para cada pagina
   +-- Capturar desktop (1440px) + mobile (390px)
   +-- Capturar estados: default, loading, empty, error
   +-- Salvar em /tmp/design-critic/screenshots/

3. CODE ANALYSIS (por pagina)
   +-- Verificar uso de semantic tokens vs hardcoded colors
   +-- Verificar consistencia de spacing/sizing
   +-- Verificar estados de interacao (hover, focus, loading, error, empty)
   +-- Verificar hierarquia visual (headings, contrast, CTA prominence)
   +-- Verificar micro-detalhes (border-radius, shadows, transitions)

4. VISUAL ANALYSIS (screenshots)
   +-- Analisar whitespace e breathing room
   +-- Comparar consistencia cross-page
   +-- Avaliar alinhamento e grid
   +-- Avaliar modernidade visual (benchmark SaaS + MedTech)

5. REPORT
   +-- Score por pilar (0-10) e score geral
   +-- Findings P0/P1/P2 com localizacao exata (file:line)
   +-- Codigo de correcao para cada finding
   +-- Salvar em docs/plans/YYYY-MM-DD-design-critique.md

6. AUTO-FIX
   +-- Aplicar todas as correcoes (P0 -> P1 -> P2)
   +-- Re-run screenshots para validar visualmente
   +-- Gerar diff summary
```

## Hard Rules

- NUNCA usar cores hardcoded em Tailwind quando existe token semantico
- NUNCA deixar botao de acao sem estado loading
- NUNCA ter menos de `gap-4` entre cards em grid
- SEMPRE ter `transition-colors` ou `transition-all` em elementos interativos
- SEMPRE usar `rounded-xl` para cards e `rounded-lg` para inputs (consistencia)
- SEMPRE ter empty state com ilustracao ou icone + CTA

## Anti-Patterns Criticos

| Anti-Pattern | Problema | Fix |
|-------------|----------|-----|
| `bg-emerald-500` | Cor hardcoded | `bg-success` |
| `onClick={fn}` sem loading | Sem feedback | `disabled={loading}` + spinner |
| `gap-2` em grid de cards | Apertado | `gap-4 sm:gap-6` |
| `rounded` sem padrao | Inconsistente | cards `rounded-xl`, inputs `rounded-lg`, badges `rounded-full` |
| `border border-gray-200` | Borda generica | `border border-border` |
| Botao sem `transition` | Interacao abrupta | `transition-colors duration-150` |
| Empty state so com texto | Sem personalidade | Icone + texto + CTA |
| Titulo e subtitulo mesmo peso | Hierarquia flat | heading bold vs muted-foreground |

## Padroes Premium

### Botao com feedback completo
```tsx
<Button
  onClick={handleSave}
  disabled={saving}
  className="transition-colors duration-150"
>
  {saving ? <Loader2 className="animate-spin h-4 w-4" /> : null}
  {saving ? t('saving') : t('save')}
</Button>
```

### Card com breathing room e hover
```tsx
<Card className="p-6 rounded-xl border-border hover:shadow-md transition-shadow duration-200">
  <CardHeader className="space-y-1.5">
    <CardTitle className="text-lg font-semibold">{title}</CardTitle>
    <CardDescription className="text-sm text-muted-foreground">{desc}</CardDescription>
  </CardHeader>
</Card>
```

### Empty state premium
```tsx
<div className="flex flex-col items-center justify-center py-16 space-y-4">
  <div className="p-4 rounded-full bg-muted">
    <InboxIcon className="h-8 w-8 text-muted-foreground" />
  </div>
  <div className="text-center space-y-1">
    <p className="text-lg font-medium">{t('empty.title')}</p>
    <p className="text-sm text-muted-foreground">{t('empty.description')}</p>
  </div>
  <Button variant="outline">{t('empty.cta')}</Button>
</div>
```

## Integracao com Outras Skills

Quando detectar problemas no escopo de outra skill, indicar no relatorio:
- Layout estrutural → `layout-audit`
- ListPage especifico → `listpage-audit`
- Mobile especifico → `mobile-pwa-usability`
- Migracao para composite → `pageshell-migration-designer`

---

*Aprovado pelo usuario em 2026-02-23*
