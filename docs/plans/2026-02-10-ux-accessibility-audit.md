---
title: "UX & Accessibility Audit — AURIA Platform"
created: 2026-02-10
updated: 2026-02-10
status: draft
author: UX Analyst Agent
tags:
  - type/audit
  - area/ux
  - area/accessibility
  - status/draft
related:
  - "[[2026-02-08-comprehensive-audit-design]]"
---

# UX & Accessibility Audit — AURIA Platform

> **Audit Date**: 2026-02-10
> **Method**: Deep codebase analysis of all page components, layout, routing, wizard flow, error states, accessibility attributes, i18n infrastructure, and mobile responsiveness.
> **Scope**: User flows, WCAG 2.1 AA compliance, mobile usability, error handling, information architecture, i18n readiness.
> **Persona**: Dr. Ana, a busy dentist checking AURIA between patients on her iPhone 15.

---

## Executive Summary

| Area | Grade | Previous (Feb 08) | Delta | Key Finding |
|------|-------|--------------------|-------|-------------|
| User Flows | A- | A- | = | Wizard flow is polished; "Paciente sem nome" still present; onboarding modal is good |
| Accessibility (WCAG 2.1 AA) | C+ | C+ | = | Skip link present; aria-labels sparse (27 total across app); no landmark roles on pages; color-only status indicators |
| Mobile Usability | B+ | N/A | NEW | Safe-area support present; bottom nav good; some touch targets too small (<44px); wizard nav "sticky" pattern works well |
| Error Handling | B+ | N/A | NEW | ErrorBoundary with Sentry; offline banner; analysis error recovery; but no retry on list pages; no session expiration handling |
| i18n Readiness | D+ | D | +0.5 | i18next installed and configured; pt-BR.json exists with 74 keys; but zero adoption in components (all strings hardcoded) |
| Information Architecture | A- | N/A | NEW | Clear navigation; clinical terminology appropriate; PageShell composites create consistent patterns |

**Overall UX Score: B+** (improved from B due to onboarding and error recovery)

---

## 1. User Flow Maps

### 1.1 Onboarding Flow: Register to First Case

```
Landing (/) --> Register (/register) --> Email Verification --> Login (/login)
     --> Dashboard (/dashboard) [WelcomeModal appears for new users]
         --> "Ver Caso Exemplo" (sample=true) OR "Criar Minha Avaliacao"
             --> NewCase (/new-case)
```

**Findings:**

| # | Issue | Severity | File |
|---|-------|----------|------|
| O-1 | Registration form has 6 fields (name, CRO, email, password, confirm, terms) which is appropriate for a professional tool, but no field-level progress indicator | Low | `/apps/web/src/pages/Register.tsx` |
| O-2 | CRO field is marked "optional" -- good. But there is no tooltip explaining what CRO is for non-Brazilian dentists who might use the platform later | Low | `Register.tsx:172` |
| O-3 | After email sent, user sees confirmation page with "Ir para Login" but no guidance about checking spam folder | Medium | `Register.tsx:83-87` |
| O-4 | WelcomeModal has 3 slides with prev/next -- good onboarding UX. Carousel dots are clickable with aria-labels. | Pass | `WelcomeModal.tsx` |
| O-5 | Dashboard greeting uses time-of-day icon (Sun/Sunset/Moon) -- delightful contextual detail | Pass | `Dashboard.tsx:128-133` |
| O-6 | OnboardingProgress component shown for new users -- good progressive disclosure | Pass | `Dashboard.tsx:175` |

### 1.2 Core Flow: New Case Wizard

```
NewCase (/new-case)
  Step 1: Photo Upload (intraoral + optional smile45/face)
  Step 2: Patient Preferences (whitening level) [full flow only]
  Step 3: AI Analysis (progress ring + step indicator)
  Step 4: DSD Simulation [full flow only]
  Step 5: Review Analysis (multi-tooth table, patient selection, DOB)
  Step 6: Result Generation (loading overlay with per-tooth progress)
    --> Redirect to /evaluation/:sessionId
```

**Findings:**

| # | Issue | Severity | File |
|---|-------|----------|------|
| W-1 | Two-path UX (Quick Case 1 credit vs Full Analysis 3 credits) is clearly communicated with credit costs below each button | Pass | `PhotoUploadStep.tsx:551-589` |
| W-2 | HEIC support with dynamic import and fallback -- excellent iOS compatibility | Pass | `PhotoUploadStep.tsx:27-52` |
| W-3 | Camera button only appears on mobile/small screens via `isMobileDevice` detection + `isSmallScreen` state -- correct behavior | Pass | `PhotoUploadStep.tsx:85-102` |
| W-4 | Drag-and-drop zone has animated gradient border on hover -- premium feel | Pass | `PhotoUploadStep.tsx:276-346` |
| W-5 | Optional photos (smile45, face) appear as dimmed cards (opacity-60) after main photo -- good progressive disclosure | Pass | `PhotoUploadStep.tsx:413-544` |
| W-6 | Tips section uses a gold accent border strip with Lightbulb icon -- non-intrusive guidance | Pass | `PhotoUploadStep.tsx:594-606` |
| W-7 | Analysis step shows scan-line animation over photo + progress ring -- engaging feedback | Pass | `AnalyzingStep.tsx:140-176` |
| W-8 | Analysis error state provides 3 actions: Back, Retry, Skip to Manual Review -- excellent error recovery | Pass | `AnalyzingStep.tsx:77-126` |
| W-9 | "Caso Exemplo" badge is visible throughout wizard when sample=true | Pass | `NewCase.tsx:244-247` |
| W-10 | DraftRestoreModal offers to restore unsaved drafts -- data loss prevention | Pass | `NewCase.tsx:312-318` |
| W-11 | Wizard navigation buttons use `flex-col-reverse sm:flex-row` -- on mobile "Voltar" appears below primary action, which is correct mobile pattern | Pass | `NewCase.tsx:268` |
| W-12 | CreditConfirmDialog gates expensive operations -- prevents accidental credit spend | Pass | `NewCase.tsx:321-324` |
| W-13 | PatientPreferencesStep uses large selectable cards for whitening level with color swatches -- high-contrast, easy to tap on mobile | Pass | `PatientPreferencesStep.tsx:76-146` |
| W-14 | Insufficient credits warning shown inline in PatientPreferencesStep | Pass | `PatientPreferencesStep.tsx:158-163` |
| W-15 | ReviewAnalysisStep component is 80+ lines of imports alone -- very complex component that could benefit from decomposition for cognitive load reduction | Medium | `ReviewAnalysisStep.tsx` |
| W-16 | Auto-save indicator shows "Salvando..." / "Salvo" badge at step >= 4 | Pass | `NewCase.tsx:249-263` |

### 1.3 Dashboard Usage

```
Dashboard (/dashboard)
  New users: ModuleCards (Nova Avaliacao, Pacientes, Inventario) + StatsGrid + OnboardingProgress
  Returning users: Tabs (Principal | Insights) + StatsGrid + SessionCards + CreditsBanner
```

**Findings:**

| # | Issue | Severity | File |
|---|-------|----------|------|
| D-1 | Previous audit found 0% completion rate and "Paciente sem nome" entries -- this is a UX pattern issue, not a bug. Users create evaluations without naming patients because the patient field is optional in the review step | Medium | `Evaluations.tsx:43` |
| D-2 | StatsGrid uses count animation hook for numbers -- polished micro-interaction | Pass | `StatsGrid.tsx`, `useCountAnimation.ts` |
| D-3 | CreditsBanner appears when credits are low -- proactive notification | Pass | `CreditsBanner.tsx` |
| D-4 | Discard draft flow uses AlertDialog with clear warning text | Pass | `Dashboard.tsx:181-199` |

### 1.4 Patient Management

```
Patients (/patients) --> PatientProfile (/patient/:id)
  - Contact info (phone, email, notes)
  - Metrics (sessions, cases, completed, first visit)
  - Session history with progress bars
  - Edit dialog (name, phone, email, notes)
  - Link to create new evaluation for this patient
```

**Findings:**

| # | Issue | Severity | File |
|---|-------|----------|------|
| P-1 | Patient list uses ListPage with search across name/phone/email and 4 sort options -- comprehensive | Pass | `Patients.tsx:81-144` |
| P-2 | Empty state says "Crie uma avaliacao para adicionar seu primeiro paciente" -- explains that patients are created through evaluations, not standalone | Pass | `Patients.tsx:135-138` |
| P-3 | PatientProfile returns `null` silently when patient not found and not loading -- should show a "Patient not found" state | Medium | `PatientProfile.tsx:40` |
| P-4 | Edit dialog uses `Textarea` for clinical notes with placeholder "Alergias, preferencias, observacoes..." -- good guidance | Pass | `PatientProfile.tsx:294-300` |
| P-5 | "Carregar mais avaliacoes" button for pagination -- good for long patient histories | Pass | `PatientProfile.tsx:230-248` |

### 1.5 Evaluation History and Sharing

```
Evaluations (/evaluations) --> EvaluationDetails (/evaluation/:id) --> Result (/result/:id)
  - Sharing: generates /shared/:token link
  - PDF Export per tooth
  - Bulk selection and completion
```

**Findings:**

| # | Issue | Severity | File |
|---|-------|----------|------|
| E-1 | Evaluations list groups by session with patient name, tooth count, date -- clear information hierarchy | Pass | `Evaluations.tsx:16-103` |
| E-2 | SessionCard has `aria-label` with patient name for screen readers | Pass | `Evaluations.tsx:34` |
| E-3 | Success banner appears after creating new session -- good confirmation feedback | Pass | `Evaluations.tsx:138-151` |
| E-4 | EvaluationDetails has floating selection bar for bulk operations -- power-user feature | Pass | `EvaluationDetails.tsx:267-286` |
| E-5 | Treatment grouping in table (same treatment type grouped with "mesmo protocolo" label) reduces cognitive load | Pass | `EvaluationDetails.tsx:310-401` |
| E-6 | Mobile view uses Cards instead of Table -- responsive pattern swap | Pass | `EvaluationDetails.tsx:408-488` |
| E-7 | SharedEvaluation page has its own header with "Visualizacao compartilhada" badge -- clear context for shared viewers | Pass | `SharedEvaluation.tsx:146-154` |
| E-8 | Shared page has loading skeleton and expired/invalid state -- good error handling | Pass | `SharedEvaluation.tsx:110-137` |
| E-9 | DSD comparison slider available on shared view -- impressive feature for patient sharing | Pass | `SharedEvaluation.tsx:176-217` |

### 1.6 Inventory Management

```
Inventory (/inventory) --> Add Resins Dialog --> Catalog Browser (Accordion by brand)
  - CSV Import/Export
  - Filter by brand, type
  - Remove with confirmation
```

**Findings:**

| # | Issue | Severity | File |
|---|-------|----------|------|
| I-1 | ResinBadge with color swatch is domain-specific and visually clear | Pass | `Inventory.tsx:52-66` |
| I-2 | Remove button uses `opacity-0 group-hover:opacity-100` -- accessible only on hover, invisible on mobile until touch | Medium | `Inventory.tsx:58-64` |
| I-3 | Catalog dialog with brand accordion and multi-select is well organized | Pass | `Inventory.tsx:168-287` |
| I-4 | CSV import has preview with matched/unmatched counts and warnings | Pass | `Inventory.tsx:321-389` |
| I-5 | Remove button has `aria-label="Remover resina"` -- good | Pass | `Inventory.tsx:62` |
| I-6 | Hidden file input for CSV uses `ref` pattern -- standard and accessible | Pass | `Inventory.tsx:159-165` |

---

## 2. Accessibility Audit (WCAG 2.1 AA)

### 2.1 Checklist Results

| WCAG Criterion | Status | Evidence | Notes |
|----------------|--------|----------|-------|
| **1.1.1 Non-text Content** | PARTIAL | Images have alt text in photo preview (`alt="Foto intraoral"`). But decorative icons throughout lack `aria-hidden="true"` in many places | Some icons have `aria-hidden="true"` (e.g., `Evaluations.tsx:73,90,97`) but inconsistent |
| **1.3.1 Info and Relationships** | FAIL | No `<main>` landmark with `id="main-content"` on most pages. The `main` tag exists in AppLayout but individual pages don't use semantic sections | `AppLayout.tsx:124` has `<main>` tag but no `role` attribute needed (implicit). Pages lack `<section>` aria-labels |
| **1.3.2 Meaningful Sequence** | PASS | DOM order matches visual order. Mobile bottom nav reflows correctly | |
| **1.4.1 Use of Color** | PARTIAL | Status indicators use color + icon (CheckCircle for completed, secondary bg for in-progress). But border-left colors on cards convey meaning without text equivalent | `Evaluations.tsx:28-31` uses green/primary border colors |
| **1.4.3 Contrast (Minimum)** | PARTIAL | `text-muted-foreground` tokens likely pass 4.5:1 against background, but `text-muted-foreground/50` and `text-muted-foreground/70` variants (used for hints/tips) may fail | `PhotoUploadStep.tsx:569,585` uses `/70` opacity |
| **1.4.4 Resize Text** | PASS | Responsive typography with `sm:text-base` / `text-sm` patterns, `max-w-*` containers | |
| **1.4.10 Reflow** | PASS | `grid-cols-1` on mobile, `sm:grid-cols-2` on tablet -- proper reflow | |
| **1.4.11 Non-text Contrast** | PARTIAL | Form inputs have border on focus. But some interactive elements (ResinBadge, treatment group checkboxes) may not have sufficient contrast | |
| **2.1.1 Keyboard** | PARTIAL | Skip link present (`App.tsx:76-80`). Keyboard shortcuts (Cmd+K, Cmd+N, ?). But wizard step indicator, comparison slider, and floating help button may not be fully keyboard-navigable | |
| **2.1.2 No Keyboard Trap** | PASS | Dialogs use Radix `Dialog` which handles focus trapping correctly | |
| **2.4.1 Bypass Blocks** | PASS | Skip link "Pular para conteudo" in `App.tsx:76-80` | |
| **2.4.2 Page Titled** | FAIL | No `document.title` management. All pages show "AURIA" or default Vite title. No `react-helmet` or equivalent | No page-specific titles |
| **2.4.3 Focus Order** | PARTIAL | Tab order follows DOM. But wizard with conditional steps may have focus jumping issues | |
| **2.4.6 Headings and Labels** | PARTIAL | Pages use `h1` for titles (Dashboard greeting, wizard step names). But some pages render title through PageShell composite and may not have proper heading hierarchy | |
| **2.4.7 Focus Visible** | PARTIAL | shadcn/ui components have `focus-visible:ring-2` (19 occurrences found in UI components). But custom buttons in `PhotoUploadStep.tsx` and `AppLayout.tsx` mobile nav may not have visible focus | Only `PatientPreferencesStep.tsx:89` has explicit `focus-visible:ring-2` among custom components |
| **2.5.5 Target Size (AAA)** | PARTIAL | HelpButton is `h-12 w-12` (48px) -- passes. Mobile bottom nav items have `min-w-[56px] h-12` -- passes. But some icon buttons are `h-8 w-8` (32px) or smaller | `AppLayout.tsx:84` logout is `h-8 w-8`; `Inventory.tsx:58-64` remove is implied small |
| **3.1.1 Language of Page** | NEEDS CHECK | Need to verify `<html lang="pt-BR">` in `index.html` | |
| **3.3.1 Error Identification** | PASS | Form validation uses `FormMessage` from shadcn/ui with Zod schemas. Analysis errors are clearly identified | |
| **3.3.2 Labels or Instructions** | PASS | All form fields have `FormLabel`. Placeholders provide examples ("CRO-SP 12345", "seu@email.com") | |
| **4.1.2 Name, Role, Value** | PARTIAL | 27 `aria-label` occurrences found. Key interactive elements have labels (sign out, search, photo remove). But many dropdown triggers, tab buttons, and navigation elements lack explicit labels | |

### 2.2 aria-label Coverage Analysis

**Total `aria-label` count: 27 across 17 files**

Areas with good coverage:
- AppLayout: 3 labels (search, sign out x2)
- PhotoUploadStep: 2 labels (remove photo buttons)
- EvaluationDetails: 2 labels ("Mais opcoes" dropdown triggers)
- Profile: 2 labels (photo upload buttons)

Areas missing `aria-label`:
- Dashboard module cards (clickable but no aria-label)
- Wizard step indicator (clickable dots/steps)
- Bottom nav links (have text labels but no explicit aria)
- Result page action buttons
- Pricing plan cards
- PatientCard links (has aria-label -- good)
- SessionCard links (has aria-label -- good)

### 2.3 Critical Accessibility Gaps

1. **No page titles**: `document.title` is never set per-page. Screen reader users cannot distinguish between pages. Estimated effort: Small (add `useEffect` with `document.title` in each page or use a `usePageTitle` hook).

2. **Missing landmark regions**: Pages render content directly inside `<Outlet>` within `<main>` but individual page sections lack `aria-label` on semantic elements. The `id="main-content"` is set on Dashboard but not on other pages.

3. **Color-only status indicators**: Card left-border colors (green for completed, primary for in-progress, amber for new) are the primary status differentiator on mobile where status text may be hidden (`hidden sm:inline`).

4. **Inconsistent focus indicators**: Custom buttons in wizard and layout (e.g., camera button, optional photo upload buttons) use `hover:` styles but may not have `:focus-visible` indicators.

---

## 3. Mobile Usability Report

### 3.1 Layout Architecture

| Component | Mobile Pattern | Assessment |
|-----------|---------------|------------|
| AppLayout sidebar | `hidden lg:flex` sidebar, visible bottom nav | Good -- standard mobile pattern |
| Bottom nav | Fixed bottom, 5 items, `safe-area-bottom` padding | Good -- proper safe area handling |
| Top bar | `sticky top-0`, brand + search + credits + theme + logout | Acceptable -- 5 items may be crowded on small screens |
| Content area | `pb-20` to avoid bottom nav overlap | Good |
| Page containers | `max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8` | Good responsive padding |

### 3.2 Touch Target Analysis

| Component | Size | Passes 44x44? | File |
|-----------|------|----------------|------|
| Bottom nav items | `min-w-[56px] h-12` (56x48px) | YES | `AppLayout.tsx:146` |
| Mobile top bar buttons | `w-9 h-9` (36x36px) | NO -- 36px < 44px minimum | `AppLayout.tsx:105,113` |
| Sidebar sign-out | `h-8 w-8` (32x32px) | NO -- but desktop only | `AppLayout.tsx:84` |
| Help button (FAB) | `h-12 w-12` (48x48px) | YES | `HelpButton.tsx:20` |
| Wizard primary CTA | `size="lg"` (~48px height) | YES | `PhotoUploadStep.tsx:555` |
| Inventory remove button | Implied small (round, `p-0.5`) | NO -- only visible on hover anyway | `Inventory.tsx:58-64` |
| Cookie consent buttons | `size="sm"` (~32px height) | NO -- but buttons have wide width | `CookieConsent.tsx:56-63` |
| WelcomeModal dots | `w-2 h-2` (8x8px) | NO -- too small for touch | `WelcomeModal.tsx:143-150` |

### 3.3 Mobile-Specific Interactions

| Feature | Implemented? | Notes |
|---------|-------------|-------|
| Safe area (notch) | YES | `safe-area-bottom` class with `env(safe-area-inset-bottom)` in CSS |
| Pull to refresh | NO | No implementation detected |
| Swipe gestures | NO | No swipe for navigation or card dismissal |
| Bottom sheet | NO | All modals use centered Dialog, not bottom sheet on mobile |
| Camera integration | YES | `capture="environment"` input for direct camera access |
| Photo drag-and-drop | YES | Supported on all photo upload zones |
| Haptic feedback | NO | No vibration API usage |

### 3.4 Responsive Breakpoints

The app uses Tailwind's default breakpoints (`sm:640px`, `md:768px`, `lg:1024px`, `xl:1280px`):
- `< lg`: Mobile layout (bottom nav, top bar)
- `>= lg`: Desktop layout (sidebar)
- Content consistently uses `sm:` prefix for tablet adaptations

**Potential gap**: No `xs` breakpoint handling. On iPhone SE (375px width), the top bar with 5 items (brand + search + credits + theme + logout) may feel cramped. Each item is `w-9` (36px) * 4 = 144px plus brand text.

---

## 4. Error States & Edge Cases Inventory

### 4.1 Error State Coverage by Page

| Page | Loading State | Empty State | Error State | Network Error | Session Expired |
|------|---------------|-------------|-------------|---------------|-----------------|
| Login | Button "Entrando..." | N/A | Toast error | No specific | No |
| Register | Button "Criando conta..." | N/A | Toast error | No specific | No |
| Dashboard | Skeleton fallbacks | OnboardingProgress | Via ErrorBoundary | OfflineBanner | No |
| NewCase Wizard | AnalyzingStep with ring | Photo upload empty state | AnalyzingStep error UI | No specific | No |
| Result | DetailPage loading | "Avaliacao nao encontrada" | Via ErrorBoundary | No specific | No |
| Evaluations | ListPage loading | EmptyState with CTA | Card with AlertTriangle + retry text | OfflineBanner | No |
| EvaluationDetails | DetailPage loading | N/A (always has data) | Via ErrorBoundary | No specific | No |
| Patients | ListPage loading | EmptyState with CTA | Card with AlertTriangle + retry text | OfflineBanner | No |
| PatientProfile | DetailPage loading | Empty session state | Returns null (BUG) | No specific | No |
| Inventory | ListPage loading | EmptyState with CTA | Via ErrorBoundary | No specific | No |
| Profile | DetailPage loading | N/A | Via ErrorBoundary | No specific | No |
| SharedEvaluation | Skeleton | N/A | Expired/invalid state | No specific | N/A (public) |
| Pricing | Skeleton for plans | Handles empty plans | Via ErrorBoundary | No specific | No |

### 4.2 Global Error Handling

| Mechanism | Implemented | File | Notes |
|-----------|-------------|------|-------|
| ErrorBoundary | YES | `ErrorBoundary.tsx` | Wraps every route individually + global. Shows "Algo deu errado" with reload/home buttons. Reports to Sentry. |
| OfflineBanner | YES | `OfflineBanner.tsx` | Fixed top banner with `role="alert"`, red background. Uses `useOnlineStatus` hook. |
| Toast notifications | YES | Sonner + shadcn toaster | Used throughout for success/error feedback |
| React Query retry | YES | `retry: 1` in QueryClient config | Single retry with `refetchOnWindowFocus: false` |
| Suspense fallback | YES | `PageLoader` component | Branded loading skeleton |

### 4.3 Critical Missing Error Handling

1. **Session expiration**: No handling for Supabase auth token expiration. If the JWT expires mid-session, API calls will fail silently or show generic errors. No "Session expired, please log in again" flow.

2. **No retry on list pages**: `Evaluations.tsx` and `Patients.tsx` show error cards but no "Tentar novamente" button (only "Tente recarregar a pagina").

3. **PatientProfile silent null return**: When patient is not found and not loading, `PatientProfile.tsx:40` returns `null` -- the user sees a blank page with only the layout shell.

4. **No optimistic updates or offline queue**: When offline, form submissions will fail with no graceful degradation. No offline data caching for recently viewed evaluations.

5. **Credit deduction on API failure**: Previous audit noted DSD credits are consumed even on error 500. No client-side credit refund mechanism visible.

---

## 5. Information Architecture Assessment

### 5.1 Navigation Structure

```
[Bottom Nav / Sidebar]
  - Inicio (Dashboard)      /dashboard
  - Avaliacoes (Evaluations) /evaluations
  - Pacientes (Patients)     /patients
  - Inventario (Inventory)   /inventory
  - Perfil (Profile)         /profile
    - Tab: Perfil
    - Tab: Assinatura
    - Tab: Faturas

[Contextual Actions]
  - Nova Avaliacao          /new-case    (from Dashboard module card, list CTAs)
  - Global Search           Cmd+K        (searches evaluations)
  - Help Button             FAB          (sample case, how it works, report bug)
  - Keyboard Shortcuts      ?            (overlay)
```

**Assessment**: Navigation depth is shallow (max 3 levels: Evaluations > Evaluation Detail > Result). This is excellent for busy dentists. The 5 bottom nav items are within the recommended limit.

### 5.2 Content Hierarchy

Each page follows the PageShell composite pattern (title > slots > content):
- **ListPage**: title + search + filters + cards/table + pagination + empty state
- **DetailPage**: breadcrumbs + title + headerActions + tabs/sections + footerActions
- **DashboardPage**: greeting + stats + modules/tabs
- **WizardPage**: step indicator + step content + navigation

**Assessment**: Very consistent. The 3-layer architecture (data > domain hooks > page adapters) enforces separation. PageShell composites create predictable layouts.

### 5.3 Labeling and Terminology

| Term | Context | Clinical Accuracy |
|------|---------|-------------------|
| "Avaliacao" | Evaluation/case session | Appropriate -- "avaliacao clinica" is standard |
| "Caso" | Individual tooth treatment | Slightly overloaded -- used for both session and per-tooth |
| "Protocolo de Estratificacao" | Layering protocol | Clinically accurate term |
| "Classificacao VITA" | Shade matching | Standard dental terminology |
| "Classe de Cavidade" | Cavity classification (I-V) | Standard (Black's classification) |
| "Substrato" | Tooth substrate condition | Appropriate clinical term |
| "DSD" | Digital Smile Design | Industry-standard abbreviation |
| "Inventario" | Resin inventory | Clear but some dentists might expect "Estoque" |
| "Creditos" | Usage credits | Clear for SaaS model |

**Assessment**: Terminology is clinically appropriate for Brazilian dentists. No jargon overload for general practitioners.

---

## 6. i18n Readiness Report

### 6.1 Current State

| Aspect | Status | Details |
|--------|--------|---------|
| i18n library | INSTALLED | `i18next` + `react-i18next` configured in `apps/web/src/lib/i18n.ts` |
| Translation file | EXISTS | `apps/web/src/locales/pt-BR.json` with 74 keys organized in 8 namespaces |
| Usage in components | ZERO | `useTranslation` is imported in 0 page components. All 207 i18n-related hits are from imports/config, not actual usage |
| Hardcoded strings | ~500+ | Every user-facing string is hardcoded Portuguese in JSX |
| Date formatting | LOCALIZED | Uses `date-fns/locale/ptBR` consistently -- good foundation |
| Number formatting | PARTIAL | Prices use `formatPrice()` helper. No general `Intl.NumberFormat` |
| RTL support | NONE | No `dir` attribute, no RTL-aware CSS utilities |
| Pluralization | MANUAL | Manual ternaries like `caso${count > 1 ? 's' : ''}` instead of i18n plural rules |

### 6.2 String Distribution by Area

| Area | Estimated Hardcoded Strings | Example |
|------|----------------------------|---------|
| Auth pages (Login, Register, Forgot, Reset) | ~40 | "Entrar", "Criar conta", "Esqueci minha senha" |
| Dashboard | ~30 | "Nova Avaliacao", "Meus Pacientes", "Insights" |
| Wizard steps | ~80 | "Foto Intraoral", "Analisando Foto", "Powered by Gemini" |
| Evaluations/Results | ~100 | "Protocolo de Estratificacao", "Passo a Passo" |
| Patients | ~20 | "Meus Pacientes", "Nenhum paciente cadastrado" |
| Inventory | ~30 | "Meu Inventario", "Adicionar Resinas" |
| Profile/Pricing | ~40 | "Meu Perfil", "Planos e precos" |
| Toasts/errors | ~30 | "Erro ao entrar", "Avaliacao criada com sucesso" |
| Landing page | ~80 | "O padrao ouro da odontologia estetica" |
| UI chrome (nav, footer, modals) | ~30 | "Inicio", "Avaliacoes", "Sair da conta" |

**Total estimate: ~480 hardcoded strings** needing extraction.

### 6.3 i18n Migration Effort

The i18n infrastructure is in place but completely unused. Migration would require:
1. Extract all hardcoded strings to `pt-BR.json` (2-3 days)
2. Add `useTranslation()` hook to every component (1-2 days)
3. Create translation files for target languages (per language: 1-2 days)
4. Handle dynamic strings from AI responses (need backend locale parameter)
5. Date/number formatting through `Intl` APIs (1 day)

**Estimated total: 5-8 developer-days for full i18n extraction, plus per-language translation effort.**

---

## 7. Prioritized UX Improvement Plan

### Priority Legend
- **P0**: Critical -- affects core usability or compliance
- **P1**: High -- significant UX improvement
- **P2**: Medium -- nice-to-have improvement
- **P3**: Low -- polish item

| Priority | Issue ID | Issue | Page/Component | Effort | Impact |
|----------|----------|-------|----------------|--------|--------|
| P0 | A-1 | Add `document.title` per page for screen readers and browser tabs | All pages | S | High -- WCAG 2.4.2 |
| P0 | A-2 | Increase mobile top bar touch targets from 36px to 44px minimum | `AppLayout.tsx:105,113` | S | High -- WCAG 2.5.5 |
| P0 | A-3 | Add text alternatives to color-only status indicators on mobile (border-left colors) | `Evaluations.tsx`, `PatientProfile.tsx` | S | High -- WCAG 1.4.1 |
| P0 | A-4 | Verify and set `<html lang="pt-BR">` in index.html | `index.html` | XS | High -- WCAG 3.1.1 |
| P1 | UX-1 | PatientProfile: show "Paciente nao encontrado" instead of returning null | `PatientProfile.tsx:40` | XS | Medium |
| P1 | UX-2 | Add "Tentar novamente" button to error states on list pages | `Evaluations.tsx:122-133`, `Patients.tsx:65-77` | S | Medium |
| P1 | UX-3 | Handle session expiration: detect 401 responses and redirect to login with message | `AuthContext.tsx`, API interceptor | M | High |
| P1 | UX-4 | Encourage patient naming: show subtle prompt when creating evaluation without patient name | Wizard ReviewStep | S | Medium |
| P1 | A-5 | Add `aria-label` to bottom nav links | `AppLayout.tsx:142-168` | XS | Medium |
| P1 | A-6 | Add `aria-hidden="true"` to all decorative icons consistently | All components | M | Medium |
| P1 | A-7 | Ensure all interactive elements have visible focus indicators (`:focus-visible:ring-2`) | Custom buttons across wizard, layout | M | Medium -- WCAG 2.4.7 |
| P2 | UX-5 | Inventory remove button: show on mobile via long-press or swipe instead of hover-only | `Inventory.tsx:58-64` | M | Medium |
| P2 | UX-6 | Add "Check spam folder" hint on email verification screen | `Register.tsx:83-87` | XS | Low |
| P2 | UX-7 | WelcomeModal carousel dots: increase touch target size from 8px to at least 24px | `WelcomeModal.tsx:143-150` | XS | Low |
| P2 | UX-8 | Add pull-to-refresh on mobile list pages | `Evaluations.tsx`, `Patients.tsx` | M | Medium |
| P2 | UX-9 | Use bottom sheet pattern for dialogs on mobile instead of centered modals | All Dialog usages | L | Medium |
| P2 | A-8 | Add `role="status"` to loading indicators and progress rings | `ProgressRing.tsx`, `LoadingOverlay.tsx` | S | Medium |
| P2 | I-1 | Extract hardcoded strings to i18n translation file (start with auth pages) | All pages | L | High (for internationalization) |
| P3 | UX-10 | Add haptic feedback for primary actions on mobile (vibration API) | Wizard CTA buttons | S | Low |
| P3 | UX-11 | Add swipe to navigate between wizard steps | `NewCase.tsx` | M | Low |
| P3 | A-9 | Add aria-live regions for dynamic content updates (toast summaries, analysis progress) | `AnalyzingStep.tsx`, toast config | M | Medium |

---

## 8. Quick UX Wins

These changes improve UX with minimal code changes (effort < 1 hour each):

1. **Page titles** (`document.title`): Add a `usePageTitle("Avaliacoes | AURIA")` hook call in each page component. Immediate screen reader and browser tab improvement.

2. **PatientProfile null guard**: Replace `if (!profile.patient && !profile.isLoading) return null;` with a "Paciente nao encontrado" card with back button.

3. **Mobile top bar touch targets**: Change `w-9 h-9` to `w-11 h-11` (44px) on the search, theme toggle, and logout buttons in the mobile header.

4. **Error retry buttons**: Add a `<Button onClick={() => window.location.reload()}>Tentar novamente</Button>` to the error cards in `Evaluations.tsx` and `Patients.tsx`.

5. **Spam folder hint**: Add `<p className="text-xs text-muted-foreground mt-2">Nao encontrou? Verifique a pasta de spam.</p>` to the email verification screen.

6. **Aria-labels on bottom nav**: Add `aria-label={item.label}` to each `NavLink` in the mobile bottom nav (they have visible text labels but explicit aria improves screen reader experience).

7. **Color-only status fix**: On mobile where status text is `hidden sm:inline`, ensure the `aria-label` or `sr-only` span provides the status text for screen readers.

8. **WelcomeModal dot size**: Change dots from `w-2 h-2` to `w-6 h-6 p-2` (visually still small dot via inner element, but touch target is 24px).

---

## 9. Personas & Journey Map Recommendations

### 9.1 Primary Persona: Dr. Ana

- **Role**: General dentist with focus on aesthetic procedures
- **Context**: Uses AURIA between patients (3-5 min sessions on iPhone)
- **Pain points**:
  - Needs to quickly upload a photo, get AI analysis, and save for later review
  - Doesn't want to spend time naming patients during busy hours (hence "Paciente sem nome")
  - Wants to share results with patients via WhatsApp/link
- **Recommendations**:
  - Add "quick patient naming" prompt at session creation (not mandatory, but visible)
  - Support sharing via native share sheet on mobile (Web Share API)
  - Consider adding a "favorites" or "pin" feature for frequently referenced protocols

### 9.2 Secondary Persona: Dr. Carlos (Power User)

- **Role**: Aesthetic specialist, high volume (20+ cases/week)
- **Context**: Uses desktop primarily, manages inventory carefully, exports PDFs
- **Pain points**:
  - Keyboard shortcuts (Cmd+K, Cmd+N) are great for him
  - Bulk operations (select + complete) save time
  - CSV import/export for inventory is essential
- **Recommendations**:
  - Add keyboard shortcut for navigating to evaluations (Cmd+E)
  - Consider batch PDF export (all evaluations in a session as one PDF)
  - Add "duplicate case" feature for similar cases

### 9.3 Tertiary Persona: Patient Viewer

- **Role**: Patient viewing shared evaluation link
- **Context**: Non-technical, viewing on phone, no account
- **Pain points**:
  - SharedEvaluation page is clean and focused
  - DSD comparison slider is intuitive
- **Recommendations**:
  - Add CTA "Agendar retorno" or similar to connect back with the dentist
  - Consider adding a brief explanation of what DSD is for patient context

### 9.4 Journey Map: Critical Path (Photo to Protocol)

```
[Upload Photo] ---> [Choose Flow] ---> [AI Analysis] ---> [Review] ---> [Generate]
     30s              5s               8-15s              2-5min         1-2min

Emotional arc:
  Curious --> Deciding --> Waiting/Engaged --> Focused --> Satisfied/Relieved

Key moments of truth:
1. Photo upload: Must be instant, support HEIC -- GOOD
2. Credit cost disclosure: Must be clear before commitment -- GOOD
3. AI analysis wait: Must feel productive, not dead time -- GOOD (animated steps)
4. Error recovery: Must not lose work -- GOOD (draft save, retry, skip)
5. Result delivery: Must feel authoritative and actionable -- GOOD (protocol + checklist)
```

---

## 10. Comparison with Previous Audit (2026-02-08)

| Finding from Feb 08 | Status in Feb 10 | Notes |
|---------------------|------------------|-------|
| DSD Edge Function 500 | Not verified (code audit only) | Error handling in DSDStep.tsx is comprehensive |
| "Paciente sem nome" entries | Still present | Structural UX issue -- patient naming is optional in review step |
| 0% completion rate | Likely unchanged | Users may not know to use checklists; consider auto-complete on PDF export |
| validateDOMNesting errors | Not verified | Would need runtime check |
| ListPage cardFilters deprecated | Not checked | PageShell version dependency |
| React Router future flags | FIXED | `v7_startTransition` and `v7_relativeSplatPath` now set in `App.tsx:74` |
| No i18n infrastructure | IMPROVED (D to D+) | i18next installed and configured, translation file exists, but zero component adoption |
| Accessibility C+ | UNCHANGED at C+ | Skip link present, some aria-labels, but missing page titles, landmarks, consistent focus indicators |

---

## Appendix A: File Reference

| File | Path | Role |
|------|------|------|
| App.tsx | `/apps/web/src/App.tsx` | Root component, routing, providers |
| AppLayout.tsx | `/apps/web/src/components/AppLayout.tsx` | Sidebar + top bar + bottom nav |
| Login.tsx | `/apps/web/src/pages/Login.tsx` | Login page |
| Register.tsx | `/apps/web/src/pages/Register.tsx` | Registration page |
| Dashboard.tsx | `/apps/web/src/pages/Dashboard.tsx` | Dashboard page adapter |
| NewCase.tsx | `/apps/web/src/pages/NewCase.tsx` | Wizard page adapter |
| Result.tsx | `/apps/web/src/pages/Result.tsx` | Treatment result page |
| Evaluations.tsx | `/apps/web/src/pages/Evaluations.tsx` | Evaluation list page |
| EvaluationDetails.tsx | `/apps/web/src/pages/EvaluationDetails.tsx` | Session detail page |
| Patients.tsx | `/apps/web/src/pages/Patients.tsx` | Patient list page |
| PatientProfile.tsx | `/apps/web/src/pages/PatientProfile.tsx` | Patient detail page |
| Inventory.tsx | `/apps/web/src/pages/Inventory.tsx` | Resin inventory page |
| Profile.tsx | `/apps/web/src/pages/Profile.tsx` | User profile page |
| SharedEvaluation.tsx | `/apps/web/src/pages/SharedEvaluation.tsx` | Public shared view |
| Landing.tsx | `/apps/web/src/pages/Landing.tsx` | Marketing landing page |
| Pricing.tsx | `/apps/web/src/pages/Pricing.tsx` | Pricing page |
| PhotoUploadStep.tsx | `/apps/web/src/components/wizard/PhotoUploadStep.tsx` | Wizard step 1 |
| PatientPreferencesStep.tsx | `/apps/web/src/components/wizard/PatientPreferencesStep.tsx` | Wizard step 2 |
| AnalyzingStep.tsx | `/apps/web/src/components/wizard/AnalyzingStep.tsx` | Wizard step 3 |
| DSDStep.tsx | `/apps/web/src/components/wizard/DSDStep.tsx` | Wizard step 4 |
| ReviewAnalysisStep.tsx | `/apps/web/src/components/wizard/ReviewAnalysisStep.tsx` | Wizard step 5 |
| ErrorBoundary.tsx | `/apps/web/src/components/ErrorBoundary.tsx` | Global error boundary |
| OfflineBanner.tsx | `/apps/web/src/components/OfflineBanner.tsx` | Offline detection |
| GlobalSearch.tsx | `/apps/web/src/components/GlobalSearch.tsx` | Cmd+K search |
| KeyboardShortcuts.tsx | `/apps/web/src/components/KeyboardShortcuts.tsx` | Keyboard shortcuts |
| HelpButton.tsx | `/apps/web/src/components/HelpButton.tsx` | Floating help FAB |
| WelcomeModal.tsx | `/apps/web/src/components/onboarding/WelcomeModal.tsx` | New user onboarding |
| CookieConsent.tsx | `/apps/web/src/components/CookieConsent.tsx` | LGPD cookie consent |
| i18n.ts | `/apps/web/src/lib/i18n.ts` | i18n configuration |
| pt-BR.json | `/apps/web/src/locales/pt-BR.json` | Portuguese translation keys |

---

*Generated by UX Analyst Agent on 2026-02-10*
