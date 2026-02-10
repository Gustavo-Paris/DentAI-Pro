---
title: "Product Strategy Audit — AURIA Platform"
created: 2026-02-10
updated: 2026-02-10
status: draft
author: PM Strategist Agent
tags:
  - type/audit
  - area/product
  - area/strategy
  - status/draft
related:
  - "[[2026-02-08-comprehensive-audit-design]]"
---

# Product Strategy Audit — AURIA Platform

## Executive Summary

**Overall Product Readiness: B+ (78/100)**

AURIA is a dental clinical decision support platform with a surprisingly mature product for its stage. The core value loop -- photo upload, AI analysis, stratification protocol, PDF export -- is fully functional and delivers genuine clinical value. The credit-based monetization with Stripe is production-grade. However, several gaps prevent it from being investor-ready or ready for aggressive growth.

### Grade Breakdown

| Area | Grade | Notes |
|------|-------|-------|
| Core AI Features | A- | Photo analysis, resin recommendation, DSD simulation all functional |
| Monetization | B+ | Credit system + Stripe fully wired; revenue leaks identified |
| User Journey | B | Onboarding exists; activation gap between signup and first value |
| Competitive Positioning | B+ | Strong differentiation via stratification protocols + inventory integration |
| Data & Analytics | C+ | Dashboard shows usage metrics; no product analytics pipeline |
| Legal/Regulatory | B- | LGPD privacy policy present; HIPAA gap; disclaimers need strengthening |
| Growth Infrastructure | D | No referral system, no email marketing, no usage-based nudges |
| Mobile Experience | B- | Responsive design works; not optimized for clinical camera workflow |

### Top 3 Risks

1. **Revenue leakage**: Credits consumed on AI errors (DSD 500 errors) without automatic refund in all failure paths
2. **Regulatory exposure**: Patient dental photos stored without explicit BAA/DPA; LGPD compliance incomplete (no data export/deletion self-service)
3. **Single AI vendor dependency**: 100% reliance on Google Gemini with no fallback; API changes or outages halt all AI features

### Top 3 Opportunities

1. **Photo-first mobile experience**: Dentists take photos at the chair; a camera-optimized mobile flow could 3x activation
2. **Inventory-driven retention**: The inventory feature creates switching costs -- dentists who populate their resin inventory are unlikely to switch
3. **Shared evaluation as growth loop**: The `/shared/:token` feature can be the viral mechanism if enhanced with patient-facing branding

---

## Feature Map

### Core Clinical Features

| Feature | Status | MVP Ready? | Gaps | Priority |
|---------|--------|------------|------|----------|
| **Photo Upload & Analysis** | Fully Implemented | Yes | Multi-photo support (frontal + 45 + face) works. AI detects teeth, classifies treatment types, identifies VITA color. | -- |
| **Resin Recommendation** | Fully Implemented | Yes | AI selects from catalog or user inventory. Shows justification, alternatives, ideal resin (if not in stock). | -- |
| **Stratification Protocol** | Fully Implemented | Yes | Layer-by-layer protocol with resin brand/shade per layer. Finishing & polishing steps included. | -- |
| **Cementation Protocol** | Fully Implemented | Yes | For porcelain veneer cases. Step-by-step cementation procedure. | -- |
| **DSD Simulation** | Implemented (Unstable) | Partial | DSD edge function returns 500 errors intermittently. Credits charged on failure. Skip mechanism exists. | P0 |
| **Multi-Tooth Detection** | Fully Implemented | Yes | AI detects 1-8+ teeth per photo. Each tooth gets independent treatment recommendation. | -- |
| **Treatment Classification** | Fully Implemented | Yes | 6 treatment types: Resina, Porcelana, Coroa, Implante, Endodontia, Encaminhamento + Gengivoplastia, Recobrimento Radicular | -- |
| **Quick Case Mode** | Fully Implemented | Yes | 4-step wizard (vs 6-step full) for faster analysis without DSD/preferences. 1 credit vs 3 credits. | -- |
| **Sample Case** | Fully Implemented | Yes | Pre-loaded demo case for new users to see the full flow without consuming credits. | -- |
| **Patient Preferences** | Fully Implemented | Yes | Whitening level preferences, aesthetic goals captured and passed to AI. | -- |

### Patient & Data Management

| Feature | Status | MVP Ready? | Gaps | Priority |
|---------|--------|------------|------|----------|
| **Patient List** | Fully Implemented | Yes | Search, sort, case counts, completion rates. | -- |
| **Patient Profile** | Fully Implemented | Yes | Contact info, clinical notes, evaluation history with pagination. | -- |
| **Patient Creation** | Implicit (via Wizard) | Partial | No standalone patient creation form. Patients are created during wizard flow. Name optional (causes "Paciente sem nome" entries). | P2 |
| **Evaluation History** | Fully Implemented | Yes | Grouped by session, filterable by status, searchable by patient name. | -- |
| **Evaluation Detail** | Fully Implemented | Yes | Treatment table, progress tracking, bulk actions, DSD preview modal. | -- |
| **Resin Inventory** | Fully Implemented | Yes | Catalog browser, CSV import/export, filter by brand/type, grid view with color swatches. | -- |
| **Result Page** | Fully Implemented | Yes | Full protocol display: case summary, DSD, stratification layers, checklist, alerts, warnings, confidence indicator, alternatives. | -- |
| **PDF Export** | Fully Implemented | Yes | Professional PDF with protocol, clinic logo, patient data. Checklist completion warning before export. | -- |

### Sharing & Collaboration

| Feature | Status | MVP Ready? | Gaps | Priority |
|---------|--------|------------|------|----------|
| **Shared Evaluation Link** | Fully Implemented | Yes | Token-based public link with expiration. Shows DSD simulation, treatment list, clinic branding. | -- |
| **Multi-User Support** | Plan-Based (DB Ready) | No | `max_users` field exists on subscription plans. No actual team/multi-user implementation in frontend. | P3 |

### Monetization Features

| Feature | Status | MVP Ready? | Gaps | Priority |
|---------|--------|------------|------|----------|
| **Credit System** | Fully Implemented | Yes | Atomic credit consumption via PostgreSQL `use_credits` RPC. Idempotent via `operation_id`. | -- |
| **Credit Refund** | Partially Implemented | Partial | Refund function exists but not called in all error paths. DSD errors charge credits without refund. | P0 |
| **Subscription Plans** | Fully Implemented | Yes | 4 tiers from DB (Starter/free to Elite). Dynamic pricing from `subscription_plans` table. | -- |
| **Stripe Checkout** | Fully Implemented | Yes | Subscription + credit pack checkout. Inline upgrade/downgrade for existing subscribers. Promotion codes enabled. | -- |
| **Stripe Portal** | Fully Implemented | Yes | Billing management via Stripe Customer Portal. | -- |
| **Stripe Webhooks** | Fully Implemented | Yes | Handles: checkout.completed, subscription.created/updated/deleted, invoice.paid/failed. Credit pack purchases. | -- |
| **Subscription Sync** | Fully Implemented | Yes | Fallback sync from frontend with 3x retry. Handles webhook delivery failures. | -- |
| **Credit Pack Purchase** | Fully Implemented | Yes | One-time credit top-ups for active subscribers. | -- |
| **Credit Usage History** | Fully Implemented | Yes | Detailed history in profile page. | -- |
| **Payment History** | Fully Implemented | Yes | Invoice list with PDF download links from Stripe. | -- |
| **Credit Confirmation Dialog** | Fully Implemented | Yes | Shows credit cost before AI operations. Lets user confirm or cancel. | -- |

### User Management

| Feature | Status | MVP Ready? | Gaps | Priority |
|---------|--------|------------|------|----------|
| **Email/Password Auth** | Fully Implemented | Yes | Zod-validated registration with password requirements. Email confirmation flow. | -- |
| **Google OAuth** | Fully Implemented | Yes | One-click Google sign-in on both login and register pages. | -- |
| **Password Reset** | Fully Implemented | Yes | Forgot password + reset password flow. | -- |
| **Profile Management** | Fully Implemented | Yes | Name, CRO, clinic name, phone, avatar upload, clinic logo upload. | -- |
| **Subscription Management** | Fully Implemented | Yes | Plan details, credit usage, estimated days remaining, Stripe portal access. | -- |

### Platform Features

| Feature | Status | MVP Ready? | Gaps | Priority |
|---------|--------|------------|------|----------|
| **Onboarding Checklist** | Fully Implemented | Yes | 3-step progress: first case, inventory, patient. Auto-hides when complete. | -- |
| **Welcome Modal** | Fully Implemented | Yes | 3-slide carousel for new users. Links to sample case or create own. | -- |
| **Dashboard Metrics** | Fully Implemented | Yes | 6 stats: total cases, patients, weekly sessions (sparkline), completion rate (progress ring), pending sessions, pending teeth. | -- |
| **Insights Tab** | Fully Implemented | Yes | Weekly trends chart, treatment distribution donut, top resins bar chart, clinical stats summary. | -- |
| **Draft Auto-Save** | Fully Implemented | Yes | Wizard state persisted. Restore modal on return. | -- |
| **Global Search** | Partially Implemented | Partial | Component exists (`GlobalSearch.tsx`) but actual search scope and functionality not verified. | P3 |
| **Keyboard Shortcuts** | Implemented | Yes | `KeyboardShortcuts` component mounted. | -- |
| **Cookie Consent** | Implemented | Yes | GDPR/LGPD cookie consent banner. | -- |
| **Offline Banner** | Implemented | Yes | Shows banner when user goes offline. | -- |
| **Dark Mode** | Fully Implemented | Yes | Theme toggle in header and landing page. | -- |
| **Error Boundary** | Fully Implemented | Yes | Global error boundary wrapping all routes. Per-page error boundaries on lazy routes. | -- |
| **Rate Limiting** | Fully Implemented | Yes | 3-tier rate limiting (per-minute/hour/day) on edge functions. Preset configs for heavy/light AI and standard ops. | -- |
| **Prompt Injection Defense** | Fully Implemented | Yes | `sanitizeForPrompt()` strips injection patterns from user-provided text before LLM calls. | -- |

### Legal & Compliance

| Feature | Status | MVP Ready? | Gaps | Priority |
|---------|--------|------------|------|----------|
| **Terms of Use** | Implemented | Partial | Covers: service description, liability limitation, IP, account responsibility, applicable law (Brazil). Missing: refund policy details, credit expiration terms, data processing specifics. | P1 |
| **Privacy Policy** | Implemented | Partial | LGPD-aligned. Covers: data collected, purpose, storage/security, sharing, user rights, cookies, retention, DPO contact. Missing: self-service data export/deletion, specific data processor list, cookie consent preferences management. | P1 |
| **Clinical Disclaimer** | Implemented | Yes | On every result page: "This plan was generated by AI and serves as a clinical decision support tool. It does not replace a thorough clinical evaluation by a Dental Surgeon." | -- |
| **Terms Acceptance** | Implemented | Yes | Checkbox on registration form with links to Terms and Privacy. | -- |

---

## Monetization & Business Model Analysis

### Credit Economy

**How it works:**
- 1 credit = 1 photo analysis (multi-tooth detection + treatment classification)
- 2 credits = 1 DSD simulation (Digital Smile Design)
- Quick Case = 1 credit (analysis only, no DSD/preferences)
- Full Case = 3 credits (analysis + preferences + DSD)
- Credits are per-plan-monthly + rollover (plan-dependent) + bonus (purchased)

**Pricing structure** (from `subscription_plans` table, loaded dynamically):
- Starter (free): limited credits, basic features
- Plans scale to Elite tier at R$249/month with 200 credits

**Revenue leaks identified:**

1. **DSD error credit loss (CRITICAL)**: When `generate-dsd` returns a 500 error, 2 credits have already been consumed via `checkAndUseCredits()`. The `refundCredits()` function exists in `_shared/credits.ts` but the audit from 2026-02-08 confirmed credits were charged on DSD 500 errors without refund. This is a trust-destroying experience.

2. **No credit expiration clarity**: Terms of use don't specify if unused credits expire at period end or roll over. The `credits_rollover` field exists but rollover policy isn't communicated to users.

3. **Free tier abuse potential**: The Starter plan gives free credits. No IP-based or device-based limit on account creation. A user could create multiple accounts for unlimited free credits.

### Stripe Integration Health: A-

**Strengths:**
- Full lifecycle handled: checkout, subscription management, webhooks, sync fallback
- Idempotent payment recording (upsert by `stripe_invoice_id`)
- Credit pack one-time payments alongside subscriptions
- Inline upgrade/downgrade for active subscribers (no new checkout needed)
- Promotion codes enabled
- Billing address collection
- Customer portal for self-service billing management
- `pt-BR` locale on checkout

**Gaps:**
- Hardcoded `https://dentai.pro` as origin fallback in checkout and portal functions (should use AURIA domain)
- No trial period implementation in checkout (trial fields exist in DB but not configured in Stripe session creation)
- No dunning/grace period logic for failed payments beyond marking `past_due`
- No proactive notification to user when subscription is `past_due` or about to expire
- `payment_method_types: ["card"]` limits payment options (no PIX, which is huge in Brazil)

---

## User Journey Analysis

### Landing to Registration (Awareness to Acquisition)

**Landing page strengths:**
- Clear value proposition: "O padrao ouro da odontologia estetica"
- Social proof: 4 testimonials from dentists (hardcoded, not real)
- Feature previews with interactive components
- FAQ addressing key objections
- Dynamic pricing section pulling from DB
- Low-friction CTA: "Testar Gratis em 2 Minutos" / "Sem cartao de credito. 3 creditos gratis."

**Landing page gaps:**
- No video demo (showing AI analysis in action would be powerful)
- Testimonials are static/hardcoded -- need real dentist testimonials
- No case study or before/after gallery
- No social media links or community proof
- Stats section claims ("6 tipos de tratamento", "15+ marcas de resinas") are generic -- no usage stats
- No SEO metadata visible in the component (title, description, OG tags)
- Missing "How much time/money does this save?" quantification

### Registration to First Value (Activation)

**Current activation path:**
1. Register (email + password or Google OAuth)
2. Email confirmation
3. Redirect to dashboard
4. Welcome modal (3 slides) with "Try sample case" or "Create my own"
5. Onboarding checklist: first case, inventory, patient

**Activation strengths:**
- Welcome modal is well-designed with clear CTAs
- Sample case lets users see the full output without spending credits
- Onboarding progress bar shows 3 clear steps

**Activation gaps:**
- **Time-to-value is too long**: User must upload a dental photo to see any AI output. If they don't have a photo ready, they bounce. The sample case helps but requires clicking through 4+ steps.
- **No guided tour**: First-time users land on a dashboard with metrics (all zeros) and no contextual hints
- **No "aha moment" optimization**: The aha moment is seeing a stratification protocol for *their* case. This requires: having a photo, uploading it, waiting for AI, reviewing results. Minimum 3+ minutes.
- **Inventory not prompted at the right moment**: After getting a first result without inventory, the system shows "Personalize suas recomendacoes" banner. This is reactive, not proactive.
- **No email drip sequence**: After registration, no automated emails to guide back to complete onboarding
- **CRO field is optional at registration**: Good for conversion, but CRO verification could be used for trust/compliance later

### Retention Hooks

**What brings dentists back:**
1. New patient cases (clinical need)
2. Inventory integration (personalized recommendations)
3. Checklist progress tracking (completion gamification)
4. Dashboard insights (usage patterns)
5. Credit balance visibility (resource awareness)

**Retention gaps:**
- **No push notifications or email reminders** for pending cases
- **No "patient follow-up" reminders** (e.g., "Patient X has 3 cases pending for 2 weeks")
- **No weekly digest email** with usage stats
- **No "streak" or gamification** beyond the initial onboarding checklist
- **Credits expire silently** -- no proactive "You have 5 credits expiring in 3 days" alert

### Referral & Virality

**Current sharing mechanism:**
- Share evaluation via token-based link (`/shared/:token`)
- Branded with AURIA and clinic name
- Shows DSD simulation comparison slider, treatment list
- Links back to AURIA landing

**Virality gaps:**
- **No referral program**: No "invite a colleague, get 5 free credits" mechanism
- **Shared link has no CTA for the viewer**: It shows the evaluation but doesn't encourage the viewing dentist to sign up
- **No social sharing** (WhatsApp, which is dominant in Brazil for professional communication)
- **PDF export doesn't include AURIA branding prominently** enough to drive organic discovery

---

## Competitive Positioning Assessment

### AURIA's Unique Moat

1. **Stratification protocol specificity**: Layer-by-layer resin protocol (base, body, enamel, incisal) with specific shade per layer. This is not generic -- it's actionable clinical guidance that competitors (Dental AI, Pearl, Overjet) don't provide.

2. **Inventory-aware recommendations**: AI knows what resins the dentist actually has. This creates switching costs and delivers practical value that generic "best resin" recommendations don't.

3. **Multi-treatment classification**: Single photo yields per-tooth treatment classification across 8+ treatment types. Most competitors focus on a single use case (caries detection, or shade matching, or treatment planning).

4. **DSD + Clinical integration**: Combining smile simulation with restorative material selection in a single workflow is unique.

### What Would Threaten a Competitor

- **Protocol database**: AURIA has built up a domain-specific prompt system that generates clinically accurate stratification protocols. This is hard to replicate without dental specialist input.
- **Resin catalog**: The underlying database of resin brands, product lines, shades, and properties (opacity, resistance, polishing, aesthetics) is a defensible asset.
- **Brazilian market focus**: Portuguese-language, BRL pricing, LGPD compliance, CRO integration -- this creates a geo-specific moat.

### Competitive Gaps

| Competitor Feature | AURIA Status | Gap |
|---|---|---|
| Caries detection accuracy metrics | Not measured | No accuracy/sensitivity reporting vs clinical gold standard |
| FDA/ANVISA clearance | Not pursued | No regulatory clearance claim |
| Integration with dental software (PMS) | Not implemented | No integration with popular Brazilian dental practice management systems (e.g., Dental Office, Simples Dental) |
| Real-time chairside camera integration | Not implemented | Must upload photos manually; no live camera feed |
| Multi-language support | PT-BR only (hardcoded) | Zero i18n infrastructure -- entire codebase is Portuguese strings |
| Team/clinic collaboration | DB fields exist, not implemented | `max_users` on plans but no multi-user features |
| Patient-facing portal | Minimal (shared link only) | No patient login, appointment booking, or consent management |
| AI model transparency | Minimal | No explanation of what model is used, training data, or accuracy benchmarks |

---

## Data & Analytics Gaps

### What Is Currently Tracked (Dashboard)

- Total cases (evaluations generated)
- Total patients
- Weekly sessions (with sparkline trend)
- Completion rate (cases marked as completed vs total)
- Pending sessions and pending teeth counts
- Treatment distribution (donut chart)
- Top resins used (bar chart)
- Inventory utilization rate
- Weekly average evaluations

### What Is NOT Tracked (Critical Gaps)

| Metric | Why It Matters | Priority |
|--------|---------------|----------|
| **User activation rate** | % of signups who complete first case within 7 days | P0 |
| **Time to first value** | Minutes from signup to first protocol viewed | P0 |
| **Credit consumption rate** | Credits used per user per week (to predict churn and upsell timing) | P1 |
| **Feature adoption funnel** | % using DSD, inventory, sharing, PDF export | P1 |
| **Churn indicators** | Days since last login, credits remaining at churn, last feature used | P1 |
| **AI quality metrics** | User satisfaction with recommendations, "reanalyze" rate, edit rate on AI suggestions | P1 |
| **Conversion funnel** | Landing -> Register -> Confirm Email -> First Case -> Paid Plan | P0 |
| **Revenue metrics** | MRR, ARPU, LTV, CAC (even estimated) | P0 |
| **Error rates** | AI function failure rates, credit-loss events | P1 |
| **NPS / user satisfaction** | No survey mechanism exists | P2 |

### Analytics Infrastructure

- **Current**: Zero analytics pipeline. No Google Analytics, Mixpanel, Amplitude, PostHog, or similar.
- **Needed**: Product analytics tool (PostHog recommended for self-hosted LGPD compliance) with event tracking for key user actions.

---

## Risk Assessment

### Regulatory Risks

| Risk | Severity | Likelihood | Mitigation Status |
|------|----------|------------|-------------------|
| **LGPD non-compliance** (patient photo data without proper consent chain) | High | Medium | Privacy policy exists but no self-service data deletion, no data processing agreement, no consent granularity |
| **HIPAA gap** (if expanding to US market) | High | Low (not in US) | Zero HIPAA infrastructure |
| **ANVISA classification** (AI as medical device) | Medium | Medium | No ANVISA registration. Clinical disclaimer present but may not be sufficient if classified as SaMD (Software as Medical Device) |
| **Patient data breach liability** | High | Low | Supabase RLS + encryption at rest. No specific PHI encryption beyond platform defaults |
| **Cross-border data transfer** | Medium | Low | Supabase/Google Gemini may process data outside Brazil. No explicit data residency guarantee |

### Clinical Risks

| Risk | Severity | Likelihood | Mitigation Status |
|------|----------|------------|-------------------|
| **Incorrect AI recommendation followed by dentist** | High | Low | Disclaimer on every result. Terms explicitly state tool is advisory only. |
| **AI hallucination in protocol** | Medium | Medium | Gemini can generate plausible but incorrect resin combinations. No clinical validation pipeline. |
| **Shade mismatch** | Medium | Medium | Photo-based color detection has inherent limitations (lighting, camera white balance). No calibration mechanism. |
| **Treatment misclassification** | Medium | Low | Multi-tooth detection occasionally miscategorizes treatment type. Review step lets dentist override. |

### Technical Risks

| Risk | Severity | Likelihood | Mitigation Status |
|------|----------|------------|-------------------|
| **Gemini API dependency** | High | Medium | 100% reliance on Google Gemini. No fallback model. API deprecation or pricing change could be existential. |
| **Supabase vendor lock-in** | Medium | Low | Auth, DB, storage, edge functions all on Supabase. Migration would be significant but not impossible (PostgreSQL is standard). |
| **DSD edge function instability** | Medium | High | Confirmed 500 errors in previous audit. Core premium feature unreliable. |
| **Edge function cold starts** | Low | Medium | Deno-based functions may have cold start latency affecting UX. |
| **Image storage costs** | Low | Medium | Clinical photos stored in Supabase Storage. As user base grows, storage costs scale linearly. No compression or tiered storage. |

### Business Risks

| Risk | Severity | Likelihood | Mitigation Status |
|------|----------|------------|-------------------|
| **Low conversion free -> paid** | High | Medium | No data on conversion rates. No conversion optimization infrastructure. |
| **Credit economy imbalance** | Medium | Medium | If free tier is too generous, no reason to pay. If too restrictive, churn. No A/B testing infrastructure. |
| **Single-market dependency** | Medium | High | 100% Brazil-focused. PT-BR only. BRL pricing only. |
| **Sole founder/team risk** | High | Unknown | Unclear team size. If single developer, bus factor = 1. |

---

## Product Roadmap

### Phase 1: Critical Fixes (Weeks 1-2) -- "Stop the Bleeding"

| Item | Type | Impact | Effort |
|------|------|--------|--------|
| Fix DSD edge function 500 errors | Bug | Revenue protection (credits charged on failure) | M |
| Implement automatic credit refund on ALL AI function failures | Bug | Trust + revenue integrity | S |
| Add product analytics (PostHog or similar) | Infrastructure | Data-driven decisions become possible | M |
| Fix hardcoded `dentai.pro` origin in Stripe functions | Bug | Checkout/portal redirect to wrong domain after rebrand | S |
| Add conversion funnel tracking (register -> activate -> pay) | Analytics | Understand where users drop off | S |
| Make patient name required in wizard (or at least strongly prompted) | UX | Eliminate "Paciente sem nome" entries | S |

### Phase 2: MVP Polish (Weeks 3-6) -- "Make It Reliable"

| Item | Type | Impact | Effort |
|------|------|--------|--------|
| Strengthen Terms of Use (refund policy, credit terms, data processing) | Legal | Regulatory compliance + trust | M |
| Add self-service data export/deletion (LGPD compliance) | Legal | Regulatory requirement | M |
| Add PIX payment option via Stripe (Brazilian payment method) | Revenue | Massive in Brazil -- many dentists prefer PIX over card | M |
| Implement email notification system (welcome drip, pending case reminders, credit low alerts) | Retention | Reduce churn, increase activation | L |
| Add real dentist testimonials to landing page | Marketing | Social proof authenticity | S |
| Add video demo to landing page | Marketing | Show product in action (huge for conversion) | M |
| Implement trial period on paid plans (7-day free trial) | Revenue | Lower barrier to paid conversion | S |
| Add WhatsApp sharing for evaluation links | Growth | Dominant communication channel for Brazilian professionals | S |
| Improve error handling UX across all AI features | UX | Consistent retry/refund/skip behavior | M |

### Phase 3: Growth (Weeks 7-14) -- "Make It Grow"

| Item | Type | Impact | Effort |
|------|------|--------|--------|
| Referral program ("Invite a colleague, both get 5 credits") | Growth | Viral coefficient > 1 | M |
| Patient-facing shared link with CTA for referring dentists | Growth | Organic discovery from patient shares | S |
| Weekly email digest with usage insights | Retention | Re-engage dormant users | M |
| Multi-language support (English, Spanish) | Market expansion | Open LATAM + US markets | XL |
| Implement team/multi-user features | Feature | Enable clinic-level subscriptions (higher ARPU) | L |
| NPS survey integration | Analytics | User satisfaction measurement | S |
| SEO optimization (meta tags, structured data, blog) | Marketing | Organic traffic acquisition | M |
| Add accuracy/confidence reporting per AI model | Trust | Transparency for clinical users | M |

### Phase 4: Scale (Weeks 15+) -- "Make It Dominant"

| Item | Type | Impact | Effort |
|------|------|--------|--------|
| Integration with Brazilian dental PMS (Dental Office, Simples Dental) | Ecosystem | Embed in existing workflow | XL |
| Mobile-native camera experience (PWA or native app) | UX | Chairside workflow optimization | XL |
| AI model diversification (add fallback to Claude/GPT for resilience) | Technical | Remove single-vendor risk | L |
| ANVISA pre-submission assessment | Regulatory | Potential regulatory clearance for marketing claims | XL |
| Patient portal with consent management | Feature | End-to-end patient experience | XL |
| AI accuracy benchmarking study with dental schools | Clinical | Clinical validation for marketing + regulatory | XL |
| A/B testing infrastructure for pricing and features | Revenue | Data-driven optimization | M |
| Annual billing option | Revenue | Improve cash flow and reduce churn | S |

---

## KPI Framework

### North Star Metric

**Weekly Active Evaluations (WAE)**: Number of evaluations created per week by unique active users. This captures both retention (users coming back) and engagement (actually using the core feature).

### Acquisition KPIs

| KPI | Target | How to Measure |
|-----|--------|----------------|
| Signup rate (landing -> register) | >5% | Analytics funnel |
| Email confirmation rate | >80% | Supabase auth events |
| Cost per registration | <R$30 | Ad spend / registrations |

### Activation KPIs

| KPI | Target | How to Measure |
|-----|--------|----------------|
| Time to first evaluation | <10 min | Timestamp diff (register -> first evaluation created) |
| Day-1 activation rate | >40% | % who create first case within 24h of signup |
| Sample case completion rate | >60% | % of new users who try sample case |
| Inventory setup rate (Day 7) | >25% | % with inventory items within 7 days |

### Revenue KPIs

| KPI | Target | How to Measure |
|-----|--------|----------------|
| Free -> Paid conversion | >8% | Subscriptions / total accounts |
| MRR | Track weekly | Sum of active subscription prices |
| ARPU | >R$80/month | MRR / active paying users |
| Credit utilization | >60% | Credits used / credits allocated |
| Credit pack purchase rate | >10% of paid users | Pack purchases / paying users |
| Churn rate (monthly) | <5% | Canceled subscriptions / total active |

### Engagement KPIs

| KPI | Target | How to Measure |
|-----|--------|----------------|
| Weekly evaluations per user | >3 | Evaluations / WAU |
| Case completion rate | >50% | Completed cases / total cases |
| DSD usage rate | >30% of evaluations | DSD simulations / total evaluations |
| PDF export rate | >20% of completed cases | PDF exports / completed cases |
| Inventory utilization in recommendations | >40% | Cases using inventory / total cases |
| Shared evaluation rate | >5% | Shared links created / total sessions |

### Retention KPIs

| KPI | Target | How to Measure |
|-----|--------|----------------|
| Day 7 retention | >50% | % returning within 7 days |
| Day 30 retention | >30% | % returning within 30 days |
| Monthly retention (paid) | >90% | 1 - churn rate |
| Feature breadth (unique features used) | >3 | Distinct features per user per month |

---

## Go-to-Market Readiness Checklist

### Must-Have for Launch

- [x] Core product loop functional (photo -> AI -> protocol -> PDF)
- [x] Credit-based monetization with Stripe
- [x] User authentication (email + Google OAuth)
- [x] Landing page with pricing
- [x] Terms of Use and Privacy Policy
- [x] Clinical disclaimer on all AI outputs
- [x] Onboarding flow for new users
- [x] Mobile-responsive design
- [x] Error boundary and offline handling
- [x] Rate limiting on AI functions
- [x] Prompt injection defense
- [ ] **DSD stability fixed** (currently 500 errors)
- [ ] **Credit refund on AI failures** (revenue integrity)
- [ ] **Product analytics installed** (can't improve what you can't measure)
- [ ] **Real testimonials** (current ones are hardcoded/fabricated)
- [ ] **SEO basics** (meta tags, title, description)
- [ ] **Email confirmation reliability verified**

### Should-Have for Growth

- [ ] PIX payment integration
- [ ] Email marketing automation (welcome sequence, re-engagement)
- [ ] Referral program
- [ ] Video demo on landing page
- [ ] WhatsApp sharing
- [ ] Trial period on paid plans
- [ ] Weekly usage digest emails
- [ ] NPS/feedback mechanism

### Nice-to-Have for Scale

- [ ] Multi-language (EN, ES)
- [ ] Team/multi-user features
- [ ] PMS integrations
- [ ] Mobile-native camera experience
- [ ] ANVISA pre-assessment
- [ ] Annual billing
- [ ] AI model fallback

---

## Investor Readiness Assessment

### What's Strong (Series A Pitch Material)

1. **Clear problem**: Dentists spend hours researching resin options per case. AURIA reduces this to 2 minutes.
2. **Working product**: Core loop is functional, not just a prototype. Real protocols, real PDFs, real patient management.
3. **Monetization proven**: Credit system + Stripe fully integrated. Revenue collection working.
4. **Domain expertise visible**: Stratification protocols, VITA color system, treatment classifications -- this isn't generic AI; it's deeply domain-specific.
5. **Defensible moat**: Resin catalog, prompt engineering, inventory integration create switching costs.
6. **Large TAM**: Brazil has ~350,000 dentists. LATAM is ~700K. Global is ~2M+.

### What's Weak (Investor Concerns)

1. **No metrics**: Zero analytics means no data on users, retention, conversion, revenue. Investors need numbers.
2. **No proven demand**: Testimonials are fabricated. No evidence of PMF beyond the product existing.
3. **Single-market, single-language**: PT-BR only limits addressable market.
4. **AI vendor risk**: 100% Gemini dependency. No fallback plan.
5. **Regulatory ambiguity**: No ANVISA assessment. May be classified as a medical device.
6. **Unknown team**: No visible team page, about page, or founder story on the platform.
7. **No growth loops**: No referral, no virality, no organic acquisition channels beyond the landing page.

### Priority for Investor Readiness

1. Install analytics and measure for 30+ days (prove or improve metrics)
2. Get 5-10 real dentist testimonials with usage data
3. Establish a "beta" or "early access" narrative with waiting list
4. Build a pitch deck quantifying the problem (hours saved, accuracy improvement)
5. Create a competitive landscape slide showing the stratification protocol differentiation
6. Address ANVISA classification proactively (legal opinion)

---

*This audit was generated by analyzing the complete AURIA codebase including 26 page components, 11 domain hooks, 10 edge functions, 7 shared backend modules, and all landing/legal/pricing/dashboard infrastructure.*
