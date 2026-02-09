---
title: Database Schema
created: 2026-02-09
updated: 2026-02-09
author: Team AURIA
status: published
tags:
  - type/guide
  - status/published
related:
  - "[[docs/00-Index/Home]]"
  - "[[02-Architecture/Overview]]"
  - "[[03-API/Edge-Functions]]"
---

# Database Schema

Supabase PostgreSQL schema for AURIA. 18 migration files, 17 tables, 16 RPCs/functions, 3 storage buckets.

---

## Entity Relationship Diagram

```
auth.users (Supabase Auth)
    │
    ├──1:1──→ profiles              (auto-created on signup)
    ├──1:N──→ patients              (PHI encrypted)
    ├──1:N──→ evaluations           (case data + AI results)
    ├──1:1──→ subscriptions         (Stripe billing)
    ├──1:1──→ evaluation_drafts     (single draft per user)
    ├──1:N──→ user_inventory        (resin inventory)
    ├──1:N──→ credit_usage          (analytics)
    ├──1:N──→ credit_pack_purchases (purchase audit log)
    ├──1:N──→ payment_history       (Stripe invoices)
    ├──1:N──→ shared_links          (temporary public links)
    └──1:N──→ rate_limits           (per-function rate tracking)

evaluations ──N:1──→ patients
evaluations ──N:1──→ resins (recommended_resin_id, ideal_resin_id)
evaluations ←──1:N── session_detected_teeth (via session_id)

subscriptions ──N:1──→ subscription_plans
user_inventory ──N:1──→ resin_catalog

credit_pack_purchases ──N:1──→ credit_packs

resins (general specs)
resin_catalog (detailed brand/shade catalog)
credit_costs (operation pricing config)
prompt_executions (AI metrics, service_role only)
```

---

## Core Tables

### profiles

User profile, auto-created on signup via trigger.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `user_id` | UUID | FK → auth.users, unique, cascade delete |
| `full_name` | TEXT | |
| `cro` | TEXT | Dental board registration |
| `avatar_url` | TEXT | |
| `clinic_name` | TEXT | |
| `clinic_logo_url` | TEXT | |
| `phone` | TEXT | |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | Auto-updated via trigger |

**RLS:** Users can only read/update their own profile.

---

### patients

Patient records with PHI encryption.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `user_id` | UUID | FK → auth.users |
| `name` | TEXT | Not null |
| `phone` | TEXT | |
| `email` | TEXT | |
| `notes` | TEXT | |
| `birth_date` | DATE | |
| `name_encrypted` | BYTEA | PHI auto-encrypted via trigger |
| `phone_encrypted` | BYTEA | PHI auto-encrypted |
| `email_encrypted` | BYTEA | PHI auto-encrypted |
| `birth_date_encrypted` | BYTEA | PHI auto-encrypted |

**Constraints:** UNIQUE(user_id, name)
**Indexes:** `idx_patients_name_trgm` (GIN trigram for fuzzy search)
**RLS:** Full CRUD restricted to `auth.uid() = user_id`

> [!info] PHI Encryption
> Patient PHI is auto-encrypted on INSERT/UPDATE via the `encrypt_patients_phi_trigger`. Uses `pgp_sym_encrypt` with a key stored in Supabase Vault. Plaintext columns kept for backwards compatibility.

---

### evaluations

Central table — dental case evaluations with AI results, protocols, and DSD data.

| Column Group | Key Columns |
|-------------|-------------|
| **Identity** | `id`, `user_id`, `patient_id`, `patient_name`, `session_id` |
| **Clinical Input** | `tooth`, `region`, `cavity_class`, `restoration_size`, `substrate`, `substrate_condition`, `enamel_condition`, `depth`, `patient_age` |
| **Case Config** | `aesthetic_level`, `tooth_color`, `stratification_needed`, `bruxism`, `longevity_expectation`, `budget`, `treatment_type`, `status`, `priority` |
| **AI Recommendations** | `recommended_resin_id` (FK → resins), `recommendation_text`, `alternatives` (JSONB), `ideal_resin_id`, `ideal_reason`, `is_from_inventory`, `ai_treatment_indication`, `ai_indication_reason` |
| **Protocols** | `stratification_protocol` (JSONB), `protocol_layers` (JSONB), `cementation_protocol` (JSONB), `generic_protocol` (JSONB), `checklist_progress`, `alerts`, `warnings` |
| **Photos** | `photo_frontal`, `photo_45`, `photo_face`, `additional_photos` (JSONB), `tooth_bounds` (JSONB) |
| **DSD** | `dsd_analysis` (JSONB), `dsd_simulation_url`, `dsd_simulation_layers` (JSONB array), `simulation_url` |
| **Preferences** | `patient_aesthetic_goals`, `patient_desired_changes` (TEXT[]), `desired_tooth_shape` |

**Key indexes:** `(user_id, created_at DESC)` for dashboard queries, `session_id` for multi-tooth flow.

**RLS:** Owner access + public read via valid `shared_links` token.

---

### session_detected_teeth

AI-detected teeth from a photo analysis session. Linked to evaluations via `session_id`.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `session_id` | UUID | Links to evaluation.session_id |
| `user_id` | UUID | |
| `tooth` | TEXT | FDI notation |
| `priority` | TEXT | alta / média / baixa |
| `treatment_indication` | TEXT | resina, porcelana, etc. |
| `cavity_class`, `restoration_size`, `substrate`, etc. | TEXT | Clinical classification |
| `tooth_bounds` | JSONB | Bounding box (% coordinates) |

**Constraints:** UNIQUE(session_id, tooth)

---

## Billing Tables

### subscription_plans

Available pricing tiers.

| Column | Type | Notes |
|--------|------|-------|
| `id` | TEXT | PK (e.g. 'starter', 'price_pro_monthly_v2') |
| `stripe_price_id` | TEXT | Maps to Stripe Price ID |
| `name` | TEXT | Display name |
| `price_monthly` | INT | Centavos BRL |
| `credits_per_month` | INT | 0 = free, -1 = unlimited |
| `max_users` | INT | Default: 1 |
| `allows_rollover` | BOOLEAN | |
| `rollover_max` | INT | Max rollover credits |
| `features` | JSONB | Feature list |
| `is_active` | BOOLEAN | |

**Default plans:**

| Plan | Price | Credits | Rollover |
|------|-------|---------|----------|
| Starter (free) | R$ 0 | 5 | No |
| Essencial | R$ 59 | 20 | No |
| Pro | R$ 119 | 60 | Up to 30 |
| Elite | R$ 249 | 200 | Up to 100 |

**RLS:** Public read for active plans.

---

### subscriptions

User subscription state, synced from Stripe.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `user_id` | UUID | FK → auth.users, unique |
| `stripe_customer_id` | TEXT | |
| `stripe_subscription_id` | TEXT | Unique |
| `plan_id` | TEXT | FK → subscription_plans |
| `status` | TEXT | active, inactive, past_due, canceled, trialing, unpaid |
| `current_period_start/end` | TIMESTAMPTZ | Billing cycle |
| `cancel_at_period_end` | BOOLEAN | |
| `credits_used_this_month` | INT | Current usage |
| `credits_rollover` | INT | From previous month |
| `credits_bonus` | INT | From pack purchases (never resets monthly) |
| `usage_reset_at` | TIMESTAMPTZ | Last monthly reset |

**RLS:** Users read own, service role manages all (webhooks).

---

### credit_costs

Configures how many credits each operation costs.

| Operation | Credits |
|-----------|---------|
| `case_analysis` | 1 |
| `dsd_simulation` | 2 |

**RLS:** Public read.

---

### credit_packs

One-time credit purchase options.

| Pack | Credits | Price |
|------|---------|-------|
| pack_10 | 10 | R$ 29 |
| pack_25 | 25 | R$ 59 |
| pack_50 | 50 | R$ 99 |

---

### credit_usage

Analytics table recording every credit transaction.

| Column | Type | Notes |
|--------|------|-------|
| `user_id` | UUID | |
| `operation` | TEXT | e.g. `case_analysis`, `case_analysis_refund` |
| `credits_used` | INT | Negative for refunds |
| `reference_id` | UUID | Links to evaluation/DSD |

---

### payment_history

Stripe invoice records.

| Column | Type | Notes |
|--------|------|-------|
| `stripe_invoice_id` | TEXT | Unique |
| `amount` | INT | Centavos BRL |
| `status` | TEXT | succeeded, failed, pending, refunded |
| `invoice_url` | TEXT | Stripe hosted invoice |
| `invoice_pdf` | TEXT | PDF download |

---

### credit_pack_purchases

Audit log for one-time credit purchases.

| Column | Type | Notes |
|--------|------|-------|
| `user_id` | UUID | |
| `pack_id` | TEXT | FK → credit_packs |
| `credits` | INT | |
| `stripe_session_id` | TEXT | Unique |
| `status` | TEXT | pending → completed |

---

## Catalog Tables

### resins

General resin product specifications (used for recommendations).

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `name` | TEXT | Product name |
| `manufacturer` | TEXT | |
| `type` | TEXT | |
| `indications` | TEXT[] | Classe I, II, III, etc. |
| `opacity`, `resistance`, `polishing`, `aesthetics` | TEXT | Quality ratings |
| `price_range` | TEXT | padrão / premium |

**RLS:** Public read.

---

### resin_catalog

Detailed catalog by brand, product line, and shade. Used for stratification protocol shade validation.

| Column | Type | Notes |
|--------|------|-------|
| `brand` | TEXT | e.g. "3M" |
| `product_line` | TEXT | e.g. "Filtek Z350 XT" |
| `shade` | TEXT | e.g. "A2B", "CT", "OA3" |
| `type` | TEXT | Body, Enamel, Dentin, Effect |
| `opacity` | TEXT | |

**Constraints:** UNIQUE(brand, product_line, shade)
**RLS:** Public read.

**Brands in catalog:** 3M Filtek Z350 XT, Ivoclar IPS Empress Direct, Tokuyama Estelite lines, SDI Aura, Kulzer Venus Diamond, Shofu Beautifil II, GC Essentia + G-aenial, Kerr Harmonize, FGM Vittra APS + Opallis Flow.

---

### user_inventory

User's personal resin inventory (links to resin_catalog).

| Column | Type | Notes |
|--------|------|-------|
| `user_id` | UUID | |
| `resin_id` | UUID | FK → resin_catalog, cascade delete |

**Constraints:** UNIQUE(user_id, resin_id)

---

## Infrastructure Tables

### shared_links

Temporary public links for sharing evaluations with patients.

| Column | Type | Notes |
|--------|------|-------|
| `session_id` | UUID | Links to evaluation session |
| `token` | TEXT | Random 32-byte hex, unique |
| `expires_at` | TIMESTAMPTZ | Default: now() + 7 days |

---

### rate_limits

Per-user, per-function rate tracking.

| Column | Type | Notes |
|--------|------|-------|
| `user_id` | UUID | |
| `function_name` | TEXT | |
| `minute_count/window` | INT / TIMESTAMPTZ | Rolling window |
| `hour_count/window` | INT / TIMESTAMPTZ | |
| `day_count/window` | INT / TIMESTAMPTZ | |

**Constraints:** UNIQUE(user_id, function_name)

---

### prompt_executions

AI prompt execution metrics (service role only).

| Column | Type | Notes |
|--------|------|-------|
| `prompt_id` | TEXT | |
| `prompt_version` | TEXT | |
| `model` | TEXT | Gemini model used |
| `tokens_in/out` | INT | Token counts |
| `estimated_cost` | NUMERIC(10,6) | USD |
| `latency_ms` | INT | |
| `success` | BOOLEAN | |
| `error` | TEXT | Error message if failed |

---

## Database Functions (RPCs)

### Credit System

| Function | Purpose | Notes |
|----------|---------|-------|
| `use_credits(user_id, operation)` → BOOLEAN | Atomic check-and-consume | `SELECT FOR UPDATE` row lock |
| `refund_credits(user_id, operation)` → BOOLEAN | Refund on AI error | Records negative credit_usage entry |
| `can_use_credits(user_id, operation)` → BOOLEAN | Check without consuming | Free tier fallback (3 analysis, 2 DSD) |
| `get_credit_cost(operation)` → INTEGER | Lookup cost | Default: 1 if not configured |
| `add_bonus_credits(user_id, credits)` → VOID | Apply pack purchase | Adds to `credits_bonus` |
| `reset_monthly_usage_with_rollover()` → INTEGER | Monthly cron reset | Rollover calc + counter reset |

> [!warning] Atomic Credits
> `use_credits()` uses `SELECT FOR UPDATE` to prevent race conditions. This was added in migration 014 after a race condition was discovered in the credit system.

### Utility Functions

| Function | Purpose |
|----------|---------|
| `handle_new_user()` | Trigger: auto-create profile on signup |
| `update_updated_at_column()` | Trigger: auto-update timestamps |
| `can_create_case(user_id)` | Legacy case limit check |
| `increment_case_usage(user_id)` | Legacy counter increment |
| `reset_monthly_usage()` | Legacy monthly reset |
| `cleanup_old_rate_limits()` | Delete stale rate_limit rows (>7 days) |

### PHI Encryption

| Function | Purpose |
|----------|---------|
| `phi_encrypt(plaintext)` → BYTEA | Encrypt with Vault key via pgp_sym_encrypt |
| `phi_decrypt(ciphertext)` → TEXT | Decrypt with Vault key |
| `encrypt_patient_phi()` | Trigger: auto-encrypt patient PHI |
| `encrypt_evaluation_phi()` | Trigger: auto-encrypt evaluation patient_name |

---

## Storage Buckets

| Bucket | Access | Content |
|--------|--------|---------|
| `clinical-photos` | Private | Intraoral and facial photos (by user_id) |
| `dsd-simulations` | Private | DSD simulation results (by user_id) |
| `avatars` | Public | User profile pictures |

All private buckets enforce `auth.uid()` ownership checks.

---

## RLS Summary

| Access Level | Tables |
|-------------|--------|
| **Owner only** (auth.uid() = user_id) | profiles, patients, evaluations, evaluation_drafts, user_inventory, session_detected_teeth |
| **Public read** | resins, resin_catalog, subscription_plans (active), credit_costs, credit_packs |
| **Owner + public via token** | evaluations (via shared_links), shared_links |
| **Service role only** | prompt_executions |
| **Owner read + service role write** | subscriptions, rate_limits, credit_usage, payment_history, credit_pack_purchases |

---

## Extensions

| Extension | Purpose |
|-----------|---------|
| `pgcrypto` | PHI encryption (pgp_sym_encrypt/decrypt) |
| `pg_trgm` | Trigram fuzzy search on patient names |

---

## Migrations

18 migration files in `supabase/migrations/`:

| # | Migration | Key Changes |
|---|-----------|-------------|
| 001 | Initial schema | profiles, patients, evaluations, resins, subscriptions |
| 002 | Storage buckets | clinical-photos, dsd-simulations, avatars |
| 003 | Rate limiting | rate_limits table + cleanup function |
| 004 | Patient search | pg_trgm extension + trigram index |
| 005 | Billing v1 | payment_history, case limit functions |
| 006 | Credit system | credit_costs, credit_usage, rollover functions |
| 007 | Stripe mapping | stripe_price_id on subscription_plans |
| 008 | Shared links | shared_links table + public eval access |
| 009 | Prompt metrics | prompt_executions table |
| 010 | Evaluation enhancements | DSD analysis, photos, preferences columns |
| 011 | Invoice uniqueness | UNIQUE constraint on stripe_invoice_id |
| 012 | Credit packs | credit_packs, credit_pack_purchases, bonus credits |
| 013 | DSD layers | dsd_simulation_layers (JSONB) for multi-layer |
| 014 | Atomic credits | SELECT FOR UPDATE in use_credits, refund_credits |
| 015 | PHI encryption | pgcrypto, Vault key, encrypt triggers |
| 016 | Prompt metrics RLS | Service role only policy |
| 017 | Resin catalog | resin_catalog table + seed data |
| 018 | Catalog expansion | Additional resin brands and shades |

---

## Related

- [[docs/00-Index/Home]] — Documentation Hub
- [[02-Architecture/Overview]] — System Architecture
- [[03-API/Edge-Functions]] — API Reference (consumers of this schema)
- [[04-Development/Setup-Guide]] — Developer Setup

---
*Updated: 2026-02-09*
