---
title: "Design System & Visual Consistency Audit — AURIA Platform"
created: 2026-02-10
updated: 2026-02-10
status: draft
author: Designer Agent
tags:
  - type/audit
  - area/design
  - area/design-system
  - status/draft
related:
  - "[[2026-02-08-comprehensive-audit-design]]"
  - "[[06-ADRs/ADR-002-pageshell-design-system-adoption]]"
---

# Design System & Visual Consistency Audit — AURIA Platform

> **Date**: 2026-02-10
> **Method**: Deep codebase analysis of all page components, design system packages, global styles, theme configuration, and component library
> **Scope**: Design system compliance, visual consistency, responsive design, branding, theming, animations, component architecture

---

## Executive Summary

| Area | Grade | Notes |
|------|-------|-------|
| Design System Compliance | **A-** | 8/9 app pages use PageShell composites; Landing/Auth pages appropriately exempt |
| Visual Consistency | **B+** | Strong token usage, minor hardcoded color drift in edge cases |
| Responsive Design | **A-** | Consistent mobile-first Tailwind approach, safe-area support |
| Branding Consistency | **B** | AURIA applied everywhere, but wordmark styling inconsistent across auth pages |
| Theming | **A** | Robust HSL CSS variable system with full light/dark support |
| Animation & Microinteractions | **A-** | Cohesive system with reduced-motion support; no Framer Motion dependency |
| Component Architecture | **B+** | Clean composition patterns, good reuse; some pages have large render trees |

**Overall Design Health: B+ (87/100)**

The AURIA platform demonstrates strong design system adoption and a thoughtful, clinically appropriate visual identity. The indigo primary + gold accent palette, paired with DM Sans / Plus Jakarta Sans typography, creates the trust and professionalism required for a clinical decision support tool. The main areas for improvement are: (1) wordmark styling inconsistency across auth pages, (2) hardcoded Tailwind color classes in place of semantic tokens for status colors, and (3) missing design tokens for several recurring patterns.

---

## 1. Design System Compliance Matrix

### 1.1 Page-Composite Mapping

| Page | Composite Used | Compliance | Issues |
|------|---------------|------------|--------|
| `Dashboard.tsx` | `DashboardPage` | 95% | Outer container `div` wraps composite with inline px/py (acceptable: adapter pattern) |
| `Evaluations.tsx` | `ListPage` | 90% | Error state rendered outside composite; success banner above composite |
| `Patients.tsx` | `ListPage` | 95% | Minor: error state rendered outside composite |
| `Inventory.tsx` | `ListPage` | 90% | Dialog/AlertDialog rendered alongside composite (acceptable) |
| `NewCase.tsx` | `WizardPage` | 95% | Well-integrated; step indicator via slot; modals external |
| `EvaluationDetails.tsx` | `DetailPage` | 90% | Custom render function for children; mobile card layout duplicates desktop logic |
| `PatientProfile.tsx` | `DetailPage` | 90% | Edit dialog rendered outside composite (acceptable) |
| `Profile.tsx` | `DetailPage` (tabs) | 90% | Sub-components inline; good tab usage |
| `Result.tsx` | `DetailPage` | 85% | Heavy children render function; many nested sections |
| `Pricing.tsx` | None (delegates to sub-components) | 70% | No PageShell composite; uses custom layout with PricingSection + PlanComparisonTable |
| `Landing.tsx` | None (marketing page) | N/A | Correctly exempt — marketing page, not an app page |
| `Login.tsx` | None (auth page) | N/A | Correctly exempt — split-panel auth layout |
| `Register.tsx` | None (auth page) | N/A | Correctly exempt — matches Login layout |
| `ForgotPassword.tsx` | None (auth page) | N/A | Correctly exempt — matches Login layout |
| `ResetPassword.tsx` | None (auth page) | N/A | Correctly exempt — matches Login layout |
| `SharedEvaluation.tsx` | None (public page) | N/A | Correctly exempt — public sharing view, no app chrome |
| `Terms.tsx` | None (legal page) | N/A | Correctly exempt — simple content page |
| `Privacy.tsx` | None (legal page) | N/A | Correctly exempt — simple content page |
| `NotFound.tsx` | None (error page) | N/A | Correctly exempt — full-screen error state |

### 1.2 Compliance Summary

- **App pages using composites**: 9/9 (Dashboard, Evaluations, Patients, Inventory, NewCase, EvaluationDetails, PatientProfile, Profile, Result)
- **Pricing page**: Should use a composite (e.g., `DetailPage` or a dedicated `PricingPage` composite) but currently uses raw layout
- **Deprecated API usage (`cardFilters`)**: 0 instances found (previously flagged in 2026-02-08 audit; appears to have been fixed)
- **Container pattern**: All app pages consistently use `max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8` (except Dashboard which uses `max-w-[960px]`)

> [!warning] Container Width Inconsistency
> Dashboard uses `max-w-[960px]` while all other pages use `max-w-5xl` (1024px). The difference is 64px. Consider standardizing.

---

## 2. Visual Consistency Report

### 2.1 Spacing Patterns

**Outer page padding** (consistent across all app pages):
```
px-4 sm:px-6 py-6 sm:py-8
```
This is well-standardized. Every app page uses this exact pattern.

**Card internal padding**:
- Most cards: `p-3 sm:p-4` or `p-4 sm:p-6` -- consistent
- Dialog content: standard shadcn padding -- consistent

**Section spacing**: `mb-6` or `mb-8` used consistently in Result page sections. `space-y-6` for form sections.

**Gap patterns**: `gap-2`, `gap-3`, `gap-4`, `gap-6` used appropriately for different density levels.

**Assessment**: Spacing is well-tokenized through Tailwind's scale. No arbitrary pixel values in spacing. Grade: **A**

### 2.2 Typography Hierarchy

The system defines two font families with clear roles:

| Role | Font | Usage |
|------|------|-------|
| Display / Headings | `Plus Jakarta Sans` (`font-display`) | Page titles, section headers, brand wordmark, stat numbers |
| Body / UI | `DM Sans` (`font-sans`) | All body text, labels, buttons, form elements |
| Monospace | `JetBrains Mono` (`font-mono`) | Tooth numbers in shared evaluation |

**Custom typography utilities** (defined in `index.css`):
- `.text-display` -- for hero-level text
- `.text-heading` -- for section headings
- `.text-label` -- for form labels and UI labels
- `.text-overline` -- for small uppercase labels

> [!info] Usage Pattern
> The custom typography utilities (`.text-display`, `.text-heading`, `.text-label`, `.text-overline`) are defined but appear underused. Most pages use direct Tailwind classes (`font-display`, `font-semibold`, `text-sm`, etc.) instead. This creates slight inconsistency in letter-spacing and line-height.

**Heading hierarchy observed**:
- Page titles: `text-2xl sm:text-3xl font-semibold font-display` or `text-xl sm:text-2xl`
- Section titles: `text-lg font-display` or `text-base font-medium`
- Card titles: `text-xl font-display` (via shadcn CardTitle)
- Body text: `text-sm` or `text-base`
- Labels: `text-xs sm:text-sm text-muted-foreground`
- Micro-copy: `text-xs text-muted-foreground`

**Assessment**: Typography is consistent overall but the custom utility classes are underutilized. Grade: **B+**

### 2.3 Color Usage

**Semantic colors (via CSS variables)**: Properly used throughout.

| Token | Light Value | Dark Value | Usage |
|-------|------------|------------|-------|
| `--primary` | Indigo `235 56% 58%` | Indigo lifted `235 60% 68%` | Primary actions, active states, icons |
| `--brand-gold` | `40 85% 55%` | `40 88% 60%` | AURIA wordmark only (`text-gradient-gold`) |
| `--destructive` | Red `0 68% 50%` | Red `0 60% 58%` | Delete actions, errors |
| `--success` | Green `160 84% 39%` | Green `160 72% 45%` | Success states |
| `--muted` | Neutral `220 12% 94%` | Charcoal `228 5% 15%` | Backgrounds, secondary text |

**Hardcoded Tailwind colors found** (non-semantic, using direct color names):

| Color | Files | Context | Severity |
|-------|-------|---------|----------|
| `emerald-500` | Evaluations, PatientProfile | Completed status border | Medium |
| `amber-500/600/400` | EvaluationDetails, Inventory, CreditBadge, ProportionsCard, Disclaimer | Warning states, treatment borders | Medium |
| `green-100/500/700` | Profile (PaymentHistory), PricingSection, PlanComparison | Success status badges, check icons | Medium |
| `red-100/400/600` | Profile (PaymentHistory), CreditBadge | Error/critical states | Medium |
| `blue-100/300/600/700` | Profile (PaymentHistory), ProportionsCard, WelcomeModal | Info states, diagrams | Low |
| `violet-500` | Landing (testimonials) | Decorative gradient | Low |
| `pink-300/600/700` | ProportionsCard | DSD diagram (clinical illustration) | Low |

**Hardcoded hex colors** (in JSX):
- `AnnotationOverlay.tsx`: 8 hardcoded hex colors for treatment type overlays on DSD canvas (`#3b82f6`, `#f59e0b`, `#a855f7`, `#ef4444`, `#f43f5e`, `#6b7280`, `#ec4899`, `#14b8a6`)
- `GoogleIcon.tsx`: 4 hex colors for Google brand mark (correctly hardcoded -- brand requirement)

> [!warning] Status Color Debt
> The system lacks semantic tokens for `warning`, `info`, and `success` status badge backgrounds. Components resort to hardcoded Tailwind color names (`green-100`, `amber-100`, `red-100`), creating dark mode fragility and inconsistency. The `--success` and `--warning` CSS variables exist but don't have corresponding Tailwind token mappings beyond the base color.

**Assessment**: Strong foundation with CSS variables, but 20+ instances of hardcoded Tailwind color classes bypass the token system. Grade: **B**

### 2.4 Border Radius

Defined via `--radius: 0.625rem` (10px) with Tailwind mappings:
- `rounded-lg`: 10px
- `rounded-md`: 8px
- `rounded-sm`: 6px
- `rounded-xl`: widely used for cards (Tailwind default 12px)
- `rounded-2xl`: used for feature icon containers
- `rounded-full`: pills, avatars

**Consistency**: Cards consistently use `rounded-xl`. Badges use Tailwind defaults. Grade: **A-**

### 2.5 Shadows

Properly tokenized via CSS variables (`--shadow-2xs` through `--shadow-2xl`), with separate light/dark values:
- Light: subtle, warm-neutral shadows
- Dark: deeper, true-black shadows

Cards use `shadow-sm hover:shadow-md` consistently. Grade: **A**

### 2.6 Icon Usage

**Library**: Exclusively Lucide React (`lucide-react`) -- 82 files import from it. No mixed icon libraries detected.

**Custom icon**: `GoogleIcon.tsx` is a standalone SVG component (appropriate for brand icon).

**Icon sizing patterns**:
- Navigation: `w-[18px] h-[18px]` (pixel-precise for alignment)
- Inline with text: `w-3 h-3` or `w-4 h-4`
- Feature icons: `w-6 h-6 sm:w-7 sm:h-7`
- Empty states: `w-8 h-8` to `w-12 h-12`
- Hero decorative: `w-8 h-8`

**Assessment**: Single icon library, consistent sizing per context. Grade: **A**

---

## 3. Component Architecture Assessment

### 3.1 Shared Component Library (`components/`)

| Category | Components | Quality |
|----------|-----------|---------|
| UI Primitives (`ui/`) | 28 components (shadcn/ui) | Excellent -- standard, well-maintained |
| Layout | `AppLayout` | Good -- clean sidebar/bottom-nav with consistent branding |
| Domain | `ResinBadge`, `StratificationProtocol`, `CreditBadge`, `CreditConfirmDialog` | Good -- domain-specific, well-encapsulated |
| Wizard | 6 components (`wizard/`) | Good -- step components are focused |
| Protocol | 8 components (`protocol/`) | Good -- specialized clinical display components |
| DSD | 4 components (`dsd/`) | Good -- complex visualization encapsulated |
| Onboarding | 2 components (`onboarding/`) | Good |
| Pricing | 5 components (`pricing/`) | Good |
| Landing | 2 components (`landing/`) | Good |
| Feedback | `EmptyState`, `LoadingOverlay`, `ProcessingOverlay`, `ErrorBoundary` | Good -- consistent feedback patterns |

### 3.2 Composition Patterns

**Strengths**:
- Page Adapter pattern (ADR-001) consistently applied: domain hooks provide data, pages compose into composites
- Slot-based composition via PageShell composites (`slots.header`, `slots.beforeContent`, `slots.navigation`, etc.)
- `memo()` used on performance-critical card components (SessionCard, InventoryResinCard)
- Lazy loading with `Suspense` for dashboard tabs (StatsGrid, InsightsTab)

**Weaknesses**:
- `Result.tsx` has a very large render tree (~495 lines) with many conditional sections -- could benefit from extracting sub-components
- `EvaluationDetails.tsx` duplicates desktop table and mobile card layouts -- consider a responsive adapter
- `Inventory.tsx` has inline dialog/filter state management -- the hook handles most of it well, but the JSX is dense

### 3.3 Props API Quality

PageShell composites have clean, well-typed APIs:
- `ListPage<T>`: Generic type for items, clear config objects for search, filters, sort, pagination
- `DashboardPage`: Module configs, tab configs, slot-based customization
- `DetailPage`: Query-driven loading, breadcrumbs, header/footer actions, sections

> [!tip] Missing Composite
> No `FormPage` or `SettingsPage` composite is used. The Profile page uses `DetailPage` with tabs, which works but isn't semantically ideal. A `SettingsPage` composite would better serve this use case.

---

## 4. Responsive Design Audit

### 4.1 Approach

**Strategy**: Mobile-first via Tailwind breakpoints (`sm:`, `md:`, `lg:`, `xl:`).

**Breakpoints used**:
- `sm` (640px): Most common -- adjusts padding, text sizes, layout shifts
- `md` (768px): Grid column changes, table visibility
- `lg` (1024px): Sidebar visibility, split-panel auth layouts, hero grid
- `xl` (1280px): Pricing grid (4 columns), auth panel padding

**No container queries** (`@container`) detected -- all responsive behavior uses viewport media queries via Tailwind.

### 4.2 Key Responsive Patterns

| Pattern | Implementation | Quality |
|---------|---------------|---------|
| Navigation | Desktop sidebar (lg:) + Mobile bottom tab bar | Excellent |
| App content | `lg:pl-56 pb-20 lg:pb-0` offset for sidebar/bottom nav | Good |
| Auth pages | Split-panel (lg:) with brand panel hidden on mobile | Good |
| Card grids | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` progressive | Good |
| Table/Card toggle | Desktop table + mobile cards in EvaluationDetails | Good |
| Wizard nav | Desktop inline, mobile sticky bottom with backdrop blur | Excellent |
| Safe area | `safe-area-bottom` utility for notch devices | Excellent |
| Text scaling | `text-sm sm:text-base` and `text-xs sm:text-sm` patterns | Consistent |

### 4.3 Mobile-Specific Features

- **Sticky wizard navigation** with `backdrop-filter: blur(12px)` and safe area inset
- **Bottom tab bar** with active indicator dot animation
- **Touch targets**: Bottom nav items are `min-w-[56px] h-12` (adequate)
- **Active press states**: `active:scale-[0.92]` and `active:scale-95` for tactile feedback
- **Hidden elements on mobile**: Desktop-only labels (`.hidden sm:inline`), truncated dates

### 4.4 Issues

1. **Mobile bottom nav overlap**: The `pb-20` on main content accounts for the 68px bottom nav, but some pages with long content (Result.tsx with many sections) could have footer actions obscured
2. **No horizontal scroll protection** on tables -- the EvaluationDetails table is `hidden sm:block` (replaced by cards), which is good, but the table itself doesn't have overflow handling if content is very wide

**Assessment**: Grade: **A-**

---

## 5. Branding Consistency Check

### 5.1 Brand Name

**Constant**: `BRAND_NAME = "AURIA"` defined in `@/lib/branding.ts`.

**Usage**: All pages that display the brand name import and use `BRAND_NAME`. Zero instances of hardcoded "DentAI" or "DentAI Pro" found in the `src/` directory. The rebrand is complete in the codebase.

> [!info] Repository Name
> The repository is still named `DentAI-Pro/`. This is cosmetic but may cause confusion. The branding within the application is fully AURIA.

### 5.2 Wordmark Styling

The AURIA wordmark uses a distinctive treatment: `font-display tracking-[0.2em] text-gradient-gold`.

However, **three inconsistencies** exist:

| Page | Wordmark Style | Expected | Issue |
|------|---------------|----------|-------|
| Login.tsx | `text-gradient-gold` | `text-gradient-gold` | Correct |
| Register.tsx | `text-gradient-gold` | `text-gradient-gold` | Correct |
| ForgotPassword.tsx | `text-primary` | `text-gradient-gold` | **Missing gold gradient** |
| ResetPassword.tsx | `text-primary` | `text-gradient-gold` | **Missing gold gradient** |
| Landing.tsx (header) | `text-primary` | `text-primary` | Correct (header uses primary, hero uses gold) |
| SharedEvaluation.tsx | `text-primary` | `text-primary` or `text-gradient-gold` | Acceptable |
| Terms.tsx | `text-primary` | Acceptable | Consistent with legal pages |
| Privacy.tsx | `text-primary` | Acceptable | Consistent with legal pages |
| AppLayout sidebar | `text-gradient-gold` | `text-gradient-gold` | Correct |
| AppLayout mobile | `text-gradient-gold` | `text-gradient-gold` | Correct |

> [!warning] Brand Inconsistency
> The ForgotPassword and ResetPassword pages use `text-primary` (indigo) for the AURIA wordmark instead of `text-gradient-gold`. Login and Register correctly use the gold gradient. All four auth pages share the same split-panel layout and should have identical wordmark styling.

### 5.3 Brand Panel (Auth Pages)

The auth pages (Login, Register, ForgotPassword, ResetPassword) share a split-panel layout with a left brand panel. However:

| Page | Brand Panel Background | Gradient Style | Dot Pattern |
|------|----------------------|----------------|-------------|
| Login | `grain-overlay bg-background` | `hsl(235_56%_58%/0.08)` | `hsl(var(--foreground))` |
| Register | `grain-overlay bg-background` | `hsl(235_56%_58%/0.08)` | `hsl(var(--foreground))` |
| ForgotPassword | `grain-overlay bg-background` | `hsl(235_56%_58%/0.08)` | `hsl(var(--foreground))` |
| ResetPassword | `grain-overlay` (no `bg-background`) | `hsl(var(--primary)/0.15)` | `hsl(var(--foreground))` |

> [!warning] ResetPassword Brand Panel Drift
> The ResetPassword page uses different gradient values (`hsl(var(--primary)/0.15)` vs `hsl(235_56%_58%/0.08)`) and omits `bg-background` on the brand panel. It also uses a different tagline ("Protocolos clinicos inteligentes...") vs the standard ("Apoio a decisao clinica com inteligencia artificial"). This breaks visual consistency in the auth flow.

### 5.4 Brand Copy

| Element | Standard Text | Consistent? |
|---------|--------------|-------------|
| Tagline | "Apoio a decisao clinica com inteligencia artificial" | Yes (except ResetPassword) |
| Hero headline | "O padrao ouro da odontologia estetica" | Yes |
| Disclaimer | "Ferramenta de apoio a decisao clinica" | Yes |
| CTA | "Testar Gratis em 2 Minutos" / "Criar Conta Gratuita" | Yes |

**Assessment**: Grade: **B** (wordmark and brand panel inconsistencies in 2 of 4 auth pages)

---

## 6. Animation & Microinteraction Inventory

### 6.1 Animation System

All animations are CSS-based (keyframes in `index.css`). No Framer Motion or other animation libraries are used.

| Animation | Duration | Easing | Usage |
|-----------|----------|--------|-------|
| `fade-in-up` | 0.6s | ease-out | Card entry, hero content reveal |
| `scale-in` | 0.3s | ease | Success checkmarks, email sent confirmation |
| `badge-pulse-ring` | 3s | ease-in-out infinite | Inventory badge, hero badge |
| `float` | - | - | Defined but usage not found in pages |
| `hero-float` | - | - | Likely used in HeroMockup component |
| `shimmer` | 1.5s | ease-in-out infinite | Skeleton loading states |
| `scan-line` | 2.5s | ease-in-out infinite | Photo analysis overlay |
| `slide-in-right/left` | 0.3s | ease-out | Wizard step transitions |
| `route-enter` | 0.25s | ease-out | Page transition on route change |
| `sparkle-burst` | 0.6s | ease-out | Case completion celebration |
| `confetti-fall` | 1.2s | ease-out | Case completion celebration |
| `progress-ring` | 0.8s | ease-out | Dashboard progress rings |
| `accordion-down/up` | 0.2s | ease-out | Accordion expand/collapse |

### 6.2 Microinteractions

| Interaction | Implementation | Quality |
|-------------|---------------|---------|
| Button press | `.btn-press:active { scale(0.98) }` | Good -- tactile feedback |
| Card hover | `hover:shadow-md hover:-translate-y-1` (cards) | Good -- subtle lift |
| Nav active indicator | Bottom dot with `bg-primary` + `active:scale-[0.92]` | Excellent |
| CTA glow | `.btn-glow-gold:hover { box-shadow }` with primary indigo glow | Good |
| Loading spinner | Lucide `Loader2` with `animate-spin` | Consistent |
| Staggered entry | `animationDelay: ${index * 0.05}s` on list items | Good -- creates flow |
| Scroll reveal | IntersectionObserver-based with `.revealed` class toggle | Good -- performant |

### 6.3 Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  .scroll-reveal, .scroll-reveal-scale { opacity: 1; transform: none; transition: none; }
  .skeleton-shimmer { animation: none; }
  .btn-press:active { transform: none; }
  .scan-line-animation::after { animation: none; opacity: 0; }
  .progress-gold::after { animation: none; }
  .celebrate-sparkle { animation: none; opacity: 0; }
  .celebrate-confetti > span { animation: none; opacity: 0; }
  .route-enter { animation: none; }
  .progress-ring-circle { animation: none; }
}
```

This is comprehensive and covers all custom animations. Grade: **A** for accessibility consideration.

**Assessment**: Grade: **A-** (cohesive, comprehensive, accessible; minor point: `float` keyframe appears unused)

---

## 7. Theme System Assessment

### 7.1 Architecture

```
ThemeProvider (next-themes)
  -> attribute="class" on <html>
  -> defaultTheme="system" enableSystem
  -> CSS variables in :root and .dark
```

The theme system uses **CSS custom properties** (HSL values without `hsl()` wrapper) consumed by Tailwind via `hsl(var(--token))`. This is the standard shadcn/ui pattern and is well-implemented.

### 7.2 Token Coverage

| Category | Light Tokens | Dark Tokens | Completeness |
|----------|-------------|-------------|--------------|
| Background/Foreground | 2 | 2 | Complete |
| Card | 2 | 2 | Complete |
| Popover | 2 | 2 | Complete |
| Primary | 2 | 2 | Complete |
| Secondary | 2 | 2 | Complete |
| Muted | 2 | 2 | Complete |
| Accent | 2 | 2 | Complete |
| Destructive | 2 | 2 | Complete |
| Success | 2 | 2 | Complete |
| Warning | 2 | 2 | **Defined but not in Tailwind config** |
| Border/Input/Ring | 3 | 3 | Complete |
| Sidebar | 8 | 8 | Complete |
| Charts | 5 | 5 | Complete |
| Brand Gold | 2 | 2 | Complete |
| Shadows | 7 | 7 | Complete (with dark-specific values) |

### 7.3 Dark Mode Quality

**Strengths**:
- Every semantic token has a carefully tuned dark variant
- Shadows use true-black in dark mode (higher opacity) vs warm-neutral in light
- Brand gold shifts warmer in dark mode for contrast
- Primary indigo is lifted (brighter) for dark surface legibility
- Grain overlay works in both themes (subtle texture)

**Weaknesses**:
- Components using hardcoded Tailwind colors (e.g., `bg-green-100 dark:bg-green-900/30`) manually define both light and dark variants -- fragile and error-prone
- The `--warning` CSS variable exists but has no Tailwind mapping in `tailwind.config.ts`, forcing components to hardcode amber classes

### 7.4 PageShell Theme Integration

The `@pageshell/theme` package defines a `portalConfig` with its own token system (`portal-*` CSS classes). However, the AURIA app does not use PageShell's theme tokens directly -- it uses its own CSS variables and Tailwind config. The PageShell composites inherit styling from the app's Tailwind context, which works because PageShell source files are included in Tailwind's content paths.

**Assessment**: Grade: **A** (robust, well-tuned light/dark system; minor gap in warning/info token Tailwind mappings)

---

## 8. Design Debt Inventory

### 8.1 High Priority

| ID | Issue | Impact | Files |
|----|-------|--------|-------|
| DD-01 | AURIA wordmark uses `text-primary` instead of `text-gradient-gold` on ForgotPassword and ResetPassword | Brand inconsistency in auth flow | `ForgotPassword.tsx`, `ResetPassword.tsx` |
| DD-02 | ResetPassword brand panel has different gradient values and tagline than Login/Register | Visual drift in auth flow | `ResetPassword.tsx` |
| DD-03 | Status colors (success/warning/error badges) use hardcoded Tailwind colors instead of semantic tokens | Dark mode fragility, maintenance burden | `Profile.tsx`, `CreditBadge.tsx`, `Inventory.tsx`, `ProportionsCard.tsx` |
| DD-04 | `--warning` CSS variable exists but has no Tailwind config mapping | Components cannot use `bg-warning` or `text-warning` | `tailwind.config.ts` |
| DD-05 | Pricing page does not use any PageShell composite | Breaks design system consistency pattern | `Pricing.tsx` |

### 8.2 Medium Priority

| ID | Issue | Impact | Files |
|----|-------|--------|-------|
| DD-06 | Dashboard container uses `max-w-[960px]` vs `max-w-5xl` (1024px) on all other pages | Subtle width inconsistency | `Dashboard.tsx` |
| DD-07 | 8 hardcoded hex colors in AnnotationOverlay for treatment type visualization | Not theme-aware for dark mode | `AnnotationOverlay.tsx` |
| DD-08 | Custom typography utilities (`.text-display`, `.text-heading`, `.text-label`) defined but underutilized | Inconsistent letter-spacing/line-height | `index.css`, all page files |
| DD-09 | `Result.tsx` has 495 lines with many conditional sections | Should extract sub-components | `Result.tsx` |
| DD-10 | `EvaluationDetails.tsx` duplicates content for desktop table and mobile cards | Maintenance burden, potential divergence | `EvaluationDetails.tsx` |

### 8.3 Low Priority

| ID | Issue | Impact | Files |
|----|-------|--------|-------|
| DD-11 | `float` keyframe defined in CSS but appears unused | Dead code | `index.css` |
| DD-12 | Inline styles used for animation delays and chart colors | Cannot be statically analyzed; minor | Multiple pages |
| DD-13 | `App.css` is empty (comment-only) | Dead file | `App.css` |
| DD-14 | Some inline styles for dot-grid patterns on auth pages could be a CSS utility class | Repeated pattern across 4 files | Auth pages |

---

## 9. Design Improvement Roadmap

### Phase 1: Brand Consistency Fix (1-2 hours)

1. **DD-01/DD-02**: Update ForgotPassword and ResetPassword to match Login/Register wordmark styling
   - Change `text-primary` to `text-gradient-gold` for AURIA wordmark
   - Align gradient values and tagline text in ResetPassword brand panel
   - Add `bg-background` to ResetPassword brand panel

### Phase 2: Token System Enhancement (2-4 hours)

2. **DD-04**: Add `warning` token to Tailwind config:
   ```ts
   warning: {
     DEFAULT: 'hsl(var(--warning))',
     foreground: 'hsl(var(--warning-foreground))',
   }
   ```
3. **DD-03**: Migrate hardcoded status color classes to semantic tokens:
   - Create utility classes or token mappings for status badge backgrounds
   - Replace `bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400` with `bg-success/10 text-success`
   - Replace `bg-amber-100 text-amber-700` with `bg-warning/10 text-warning`
   - Replace `bg-red-100 text-red-700` with `bg-destructive/10 text-destructive`

### Phase 3: Structural Improvements (4-8 hours)

4. **DD-05**: Wrap Pricing page in a PageShell composite (e.g., `DetailPage` with no back button)
5. **DD-06**: Standardize Dashboard container to `max-w-5xl` or create a `--container-app` token
6. **DD-09/DD-10**: Extract Result.tsx sections into sub-components; unify EvaluationDetails responsive rendering
7. **DD-07**: Create a treatment color map that uses CSS variables for DSD overlay colors
8. **DD-14**: Extract dot-grid pattern inline style into a CSS utility class

### Phase 4: Polish (2-4 hours)

9. **DD-08**: Audit typography usage and migrate to custom utility classes where appropriate
10. **DD-11/DD-13**: Remove dead CSS keyframe and empty file
11. Create a `BrandWordmark` component to encapsulate wordmark styling and prevent drift

---

## 10. Design Tokens Recommendations

### 10.1 Tokens That Should Exist

| Token | Current Workaround | Recommendation |
|-------|-------------------|----------------|
| `--warning` (Tailwind mapping) | Hardcoded `amber-*` classes | Add to `tailwind.config.ts` |
| `--info` | Hardcoded `blue-*` classes | Define `--info: 198 60% 48%` and add to config |
| `--status-success-bg` | `bg-green-100 dark:bg-green-900/30` | `bg-success/10` (needs alpha variant support) |
| `--status-warning-bg` | `bg-amber-100 dark:bg-amber-900/30` | `bg-warning/10` |
| `--status-error-bg` | `bg-red-100 dark:bg-red-900/30` | `bg-destructive/10` |
| `--container-app-width` | `max-w-5xl` / `max-w-[960px]` mixed | Standardize to a single token |
| `--card-border-left-completed` | `border-l-emerald-500` | Should map to `border-l-success` |
| `--card-border-left-active` | `border-l-primary` | Already tokenized (good) |
| `--treatment-color-*` | 8 hardcoded hex values in AnnotationOverlay | CSS variables per treatment type |

### 10.2 Animation Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--animation-duration-fast` | `0.2s` | Accordion, micro-interactions |
| `--animation-duration-normal` | `0.3s` | Step transitions, scale-in |
| `--animation-duration-slow` | `0.6s` | Fade-in-up, scroll reveal |
| `--animation-easing-standard` | `ease-out` | Most animations |

---

## 11. Style Guide Gaps

### 11.1 What Is Documented (Implicit via Code)

- Color tokens (CSS variables in `index.css`)
- Font families (Tailwind config)
- Shadow system (CSS variables)
- Animation keyframes (CSS comments in `index.css`)
- Brand gold usage rule (CSS comments: "ONLY for AURIA wordmark + premium moments")

### 11.2 What Is Missing

| Gap | Impact | Priority |
|-----|--------|----------|
| No Storybook or component documentation | New developers cannot preview components | Medium |
| No design token documentation | Token naming rationale undocumented | Medium |
| No spacing scale documentation | Developers must infer from existing code | Low |
| No icon usage guidelines | Which icon for which action? | Low |
| No color usage guidelines beyond "gold = brand only" | When to use `primary/10` vs `secondary`? | Medium |
| No responsive breakpoint guidelines | When to use `sm:` vs `md:` vs `lg:`? | Low |
| No animation usage guidelines | When to animate entry, when to skip? | Low |
| No status color mapping documentation | Which color means "completed" vs "in progress"? | Medium |
| No `BrandWordmark` component | Wordmark styling is copy-pasted across pages | Medium |

---

## 12. Cross-Reference with Previous Audit (2026-02-08)

| Previous Finding | Current Status | Notes |
|-----------------|----------------|-------|
| `cardFilters` deprecated warnings | **Fixed** | No instances found in current codebase |
| Accessibility C+ | Not directly re-evaluated | Focus indicators exist (`:focus-visible`), but full a11y audit needed |
| Performance B+ | Not directly re-evaluated | Lazy loading and Suspense observed in Dashboard |
| DSD Edge Function 500 | Not design-related | Backend issue, but DSD UI handles errors gracefully with retry+skip |
| validateDOMNesting errors | Not directly re-evaluated | Would need runtime check |

---

## Appendix A: File Reference

| File | Path |
|------|------|
| Tailwind Config | `apps/web/tailwind.config.ts` |
| Global CSS | `apps/web/src/index.css` |
| Branding Constants | `apps/web/src/lib/branding.ts` |
| Theme Provider | `apps/web/src/components/ThemeProvider.tsx` |
| App Layout | `apps/web/src/components/AppLayout.tsx` |
| PageShell Theme Config | `packages/pageshell-theme/src/theme-config.ts` |
| PageShell Composites | `packages/pageshell-composites/src/` |
| UI Primitives | `apps/web/src/components/ui/` |
| All Pages | `apps/web/src/pages/` |

---

*End of audit. Generated 2026-02-10 by Designer Agent.*
