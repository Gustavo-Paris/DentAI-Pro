---
title: Edge Functions API Reference
created: 2026-02-09
updated: 2026-02-09
author: Team AURIA
status: published
tags:
  - type/api
  - status/published
related:
  - "[[docs/00-Index/Home]]"
  - "[[02-Architecture/Overview]]"
  - "[[06-ADRs/ADR-003-centralized-prompt-management]]"
  - "[[05-Operations/Runbooks/Deploy-Edge-Functions]]"
---

# Edge Functions API Reference

8 Supabase Edge Functions (Deno runtime) handling AI analysis and billing.

**Base URL:** `https://<project-id>.supabase.co/functions/v1`

---

## Summary

| Function | Method | Auth | Rate Limit | Credits | Purpose |
|----------|--------|------|------------|---------|---------|
| [[#analyze-dental-photo]] | POST | Bearer | AI_HEAVY | 1 (`case_analysis`) | Detect teeth & classify problems |
| [[#generate-dsd]] | POST | Bearer | AI_HEAVY | 1 (`dsd_simulation`) | DSD analysis + simulation image |
| [[#recommend-resin]] | POST | Bearer | AI_LIGHT | None | Resin recommendation & protocol |
| [[#recommend-cementation]] | POST | Bearer | AI_LIGHT | None | Cementation protocol |
| [[#stripe-webhook]] | POST | Webhook Sig | None | N/A | Stripe event processing |
| [[#create-checkout-session]] | POST | Bearer | None | None | Checkout (subscription or credit pack) |
| [[#create-portal-session]] | POST | Bearer | None | None | Billing portal access |
| [[#sync-subscription]] | POST | Bearer | None | None | Fallback subscription sync |

---

## Common Patterns

### Authentication

All AI and billing functions (except `stripe-webhook`) require a Bearer token:

```
Authorization: Bearer <supabase_auth_jwt>
Content-Type: application/json
```

> [!warning] ES256 Tokens
> Supabase auth tokens use ES256. Edge functions have `verify_jwt = false` in config and authenticate internally via `supabase.auth.getUser(token)` with service role key.

### Rate Limits

| Level | Per Minute | Per Hour | Per Day |
|-------|-----------|----------|---------|
| **AI_HEAVY** | 10 | 50 | 200 |
| **AI_LIGHT** | 20 | 100 | 500 |

Rate-limited responses include:

```
Retry-After: <seconds>
X-RateLimit-Remaining-Minute: <count>
X-RateLimit-Remaining-Hour: <count>
X-RateLimit-Remaining-Day: <count>
```

### CORS

**Allowed origins:** `dentai.pro`, `www.dentai.pro`, `auria-ai.vercel.app`, `dentai-pro.vercel.app`, `*.dentai.pro`, `localhost:*` (dev only).

### Error Format

All errors return:

```json
{
  "error": "User-friendly message",
  "code": "ERROR_CODE",
  "requestId": "a1b2c3d4"
}
```

Common error codes:

| Code | Status | Meaning |
|------|--------|---------|
| `UNAUTHORIZED` | 401 | Missing Authorization header |
| `INVALID_TOKEN` | 401 | Invalid or expired JWT |
| `INSUFFICIENT_CREDITS` | 402 | Not enough credits |
| `RATE_LIMITED` | 429 | Rate limit exceeded |
| `INVALID_REQUEST` | 400 | Validation failed |
| `AI_ERROR` | 500 | Gemini API failure |
| `PROCESSING_ERROR` | 500 | Unexpected server error |

### Credit System

Credit-consuming functions check balance atomically via `use_credits()` RPC (row-level locking). On AI error or processing failure, credits are automatically refunded via `refundCredits()`.

Insufficient credits response (402):

```json
{
  "error": "Créditos insuficientes",
  "code": "INSUFFICIENT_CREDITS",
  "credits_available": 0,
  "credits_required": 1,
  "is_free_user": true,
  "upgrade_url": "/pricing"
}
```

---

## AI Functions

### analyze-dental-photo

`POST /functions/v1/analyze-dental-photo`

Analyzes intraoral photos via Gemini vision. Detects teeth, classifies cavity type, substrate, and treatment indication.

**AI Model:** `gemini-3-flash-preview` | Temperature: 0.1 | Max tokens: 3000

**Request:**

```json
{
  "imageBase64": "data:image/jpeg;base64,...",
  "imageType": "intraoral"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `imageBase64` | string | Yes | Base64-encoded image or data URL (JPEG/PNG/WEBP, max 10MB) |
| `imageType` | string | No | `"intraoral"` \| `"frontal_smile"` \| `"45_smile"` \| `"face"`. Default: `"intraoral"` |

**Success (200):**

```json
{
  "success": true,
  "analysis": {
    "detected": true,
    "confidence": 85,
    "primary_tooth": "11",
    "vita_shade": "A2",
    "detected_teeth": [
      {
        "tooth": "11",
        "tooth_region": "anterior-superior",
        "cavity_class": "Classe IV",
        "restoration_size": "Média",
        "substrate": "Esmalte e Dentina",
        "substrate_condition": "Saudável",
        "enamel_condition": "Fraturado",
        "depth": "Média",
        "priority": "alta",
        "treatment_indication": "resina",
        "indication_reason": "Fratura incisal com exposição de dentina",
        "notes": null,
        "tooth_bounds": { "x": 40, "y": 20, "width": 15, "height": 30 }
      }
    ],
    "observations": ["Fratura incisal mesial do elemento 11"],
    "warnings": []
  }
}
```

**Key types:**

- `treatment_indication`: `"resina"` | `"porcelana"` | `"coroa"` | `"implante"` | `"endodontia"` | `"encaminhamento"`
- `cavity_class`: `"Classe I"` through `"Classe VI"`
- `restoration_size`: `"Pequena"` | `"Média"` | `"Grande"` | `"Extensa"`
- `substrate`: `"Esmalte"` | `"Dentina"` | `"Esmalte e Dentina"` | `"Dentina profunda"`
- `tooth_bounds`: percentages (0–100) for bounding box overlay

**Errors:**

| Status | Code | Reason |
|--------|------|--------|
| 400 | `IMAGE_INVALID` | Bad base64 format |
| 400 | `IMAGE_TOO_LARGE` | Image > 10MB |
| 400 | `IMAGE_FORMAT_UNSUPPORTED` | Not JPEG/PNG/WEBP |
| 402 | `INSUFFICIENT_CREDITS` | No credits |
| 429 | `RATE_LIMITED` | Rate limit exceeded |
| 500 | `AI_ERROR` | Gemini failure (credits refunded) |
| 500 | `ANALYSIS_FAILED` | No valid analysis (credits refunded) |

---

### generate-dsd

`POST /functions/v1/generate-dsd`

Generates Digital Smile Design analysis and simulation image.

**AI Models:** Analysis: `gemini-2.5-pro` (temp 0.1) | Simulation: `gemini-3-flash-preview` (temp 0.55)

**Request:**

```json
{
  "imageBase64": "data:image/jpeg;base64,...",
  "evaluationId": "uuid",
  "toothShape": "natural",
  "additionalPhotos": {
    "smile45": "data:image/jpeg;base64,...",
    "face": "data:image/jpeg;base64,..."
  },
  "patientPreferences": {
    "whiteningLevel": "natural",
    "aestheticGoals": "Sorriso mais harmonioso",
    "desiredChanges": ["Alinhamento", "Proporção"]
  },
  "layerType": "complete-treatment",
  "analysisOnly": false,
  "regenerateSimulationOnly": false,
  "clinicalObservations": ["Desgaste incisal"],
  "clinicalTeethFindings": [
    { "tooth": "11", "treatment_indication": "porcelana", "indication_reason": "Fratura extensa" }
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `imageBase64` | string | Yes | Smile photo (data URL) |
| `evaluationId` | string | No | UUID — links to evaluation for DB save |
| `toothShape` | string | No | `"natural"` \| `"quadrado"` \| `"triangular"` \| `"oval"` \| `"retangular"` |
| `additionalPhotos` | object | No | 45-degree smile and/or face photo |
| `patientPreferences` | object | No | Whitening level, goals, desired changes |
| `layerType` | string | No | `"restorations-only"` \| `"whitening-restorations"` \| `"complete-treatment"` |
| `analysisOnly` | boolean | No | Skip simulation generation |
| `regenerateSimulationOnly` | boolean | No | Reuse existing analysis, only redo simulation |
| `clinicalObservations` | string[] | No | From photo analysis — prevents contradictions |
| `clinicalTeethFindings` | array | No | Per-tooth findings to validate DSD suggestions |

**Success (200):**

```json
{
  "analysis": {
    "facial_midline": "centrada",
    "dental_midline": "alinhada",
    "smile_line": "média",
    "buccal_corridor": "adequado",
    "occlusal_plane": "nivelado",
    "golden_ratio_compliance": 78,
    "symmetry_score": 82,
    "smile_arc": "consonante",
    "confidence": "alta",
    "face_shape": "oval",
    "recommended_tooth_shape": "oval",
    "lip_thickness": "médio",
    "overbite_suspicion": "não",
    "suggestions": [
      {
        "tooth": "11",
        "current_issue": "Proporção inadequada",
        "proposed_change": "Restauração direta com resina",
        "treatment_indication": "resina"
      }
    ],
    "observations": ["Sorriso harmônico com leve desvio de linha média"]
  },
  "simulation_url": "userId/dsd_1707500000.png",
  "simulation_note": null,
  "layer_type": "complete-treatment"
}
```

**Credit logic:**
- First call: 1 credit (`dsd_simulation`)
- Follow-up with `regenerateSimulationOnly=true` + `evaluationId` + existing `dsd_analysis`: free
- Credits refunded on analysis failure

**Post-processing safety nets:**
1. Visagismo stripped if no face photo (defaults `face_shape: "oval"`)
2. Gengivoplastia filtered if `smile_line="baixa"` (insufficient gingival display)
3. Gengivoplastia filtered if `overbite_suspicion="sim"` (deep bite contraindication)

---

### recommend-resin

`POST /functions/v1/recommend-resin`

Generates personalized resin recommendation with stratification protocol, finishing steps, and alternatives. Considers user inventory if available.

**AI Model:** `gemini-2.0-flash` | Temperature: 0.3 | Max tokens: 8192

**No credits consumed.**

**Request:**

```json
{
  "evaluationId": "uuid",
  "userId": "uuid",
  "patientAge": "35",
  "tooth": "11",
  "region": "anterior-superior",
  "cavityClass": "Classe IV",
  "restorationSize": "Média",
  "substrate": "Esmalte e Dentina",
  "aestheticLevel": "alto",
  "toothColor": "A2",
  "stratificationNeeded": true,
  "bruxism": false,
  "longevityExpectation": "longo",
  "budget": "premium",
  "depth": "Média",
  "substrateCondition": "Saudável",
  "enamelCondition": "Fraturado",
  "clinicalNotes": "Paciente com alta exigência estética",
  "aestheticGoals": "Resultado natural e imperceptível"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `evaluationId` | string | Yes | UUID |
| `userId` | string | Yes | UUID (verified against token) |
| `patientAge` | string | Yes | Numeric string |
| `tooth` | string | Yes | FDI notation `"11"`–`"48"` |
| `region` | string | Yes | `"anterior-superior"` \| `"anterior-inferior"` \| `"posterior-superior"` \| `"posterior-inferior"` |
| `cavityClass` | string | Yes | `"Classe I"` through `"Classe VI"`, or `"Faceta Direta"`, `"Recontorno Estético"` |
| `restorationSize` | string | Yes | `"Pequena"` \| `"Média"` \| `"Grande"` \| `"Extensa"` |
| `substrate` | string | Yes | `"Esmalte"` \| `"Dentina"` \| `"Esmalte e Dentina"` \| `"Dentina profunda"` |
| `aestheticLevel` | string | Yes | `"baixo"` \| `"médio"` \| `"alto"` \| `"muito alto"` |
| `toothColor` | string | Yes | VITA shade (e.g. `"A2"`, `"BL1"`) |
| `stratificationNeeded` | boolean | Yes | Whether layered protocol is needed |
| `bruxism` | boolean | Yes | Patient has bruxism |
| `longevityExpectation` | string | Yes | `"curto"` \| `"médio"` \| `"longo"` |
| `budget` | string | Yes | `"padrão"` \| `"premium"` |
| `clinicalNotes` | string | No | Max 2000 chars (sanitized) |
| `aestheticGoals` | string | No | Max 1000 chars (sanitized) |
| `dsdContext` | object | No | DSD analysis context for consistency |

**Success (200):**

```json
{
  "success": true,
  "recommendation": {
    "resin": {
      "id": "uuid",
      "name": "Filtek Supreme Ultra",
      "manufacturer": "3M",
      "price_range": "premium"
    },
    "justification": "Resina nanoparticulada ideal para restaurações anteriores...",
    "isFromInventory": false,
    "idealResin": null,
    "idealReason": null,
    "alternatives": [
      {
        "resin": "Harmonize - Kerr",
        "shade": "A2B",
        "technique": "Estratificação simplificada",
        "tradeoff": "Menos opções de opacidade"
      }
    ],
    "protocol": {
      "layers": [
        {
          "order": 1,
          "name": "Dentina Opaca",
          "resin_brand": "3M - Filtek Supreme Ultra",
          "shade": "A2O",
          "thickness": "1.0mm",
          "purpose": "Mascarar substrato escurecido",
          "technique": "Incremento oblíquo"
        }
      ],
      "finishing": {
        "contouring": [
          { "order": 1, "tool": "Ponta diamantada FF", "speed": "alta rotação", "time": "30s", "tip": "Movimentos leves" }
        ],
        "polishing": [
          { "order": 1, "tool": "Disco Sof-Lex", "grit": "médio", "speed": "baixa rotação", "time": "20s", "tip": "Sem pressão" }
        ],
        "maintenance_advice": "Polimento a cada 6 meses"
      },
      "checklist": ["Verificar oclusão", "Checar contato proximal"],
      "alerts": [],
      "warnings": [],
      "confidence": "alta"
    }
  }
}
```

**Inventory fallback:** If AI recommends a resin not in user inventory but user has inventory, falls back to best budget-appropriate option and sets `isFromInventory: true`.

**DB updates:** Saves `recommended_resin_id`, `stratification_protocol`, `alternatives`, `alerts`, `warnings` to `evaluations` table.

---

### recommend-cementation

`POST /functions/v1/recommend-cementation`

Generates cementation protocol for indirect restorations (ceramic/porcelain).

**AI Model:** `gemini-2.5-pro` | Temperature: 0.3 | Max tokens: 4000

**No credits consumed.**

**Request:**

```json
{
  "evaluationId": "uuid",
  "teeth": ["11", "12", "13"],
  "shade": "A1",
  "ceramicType": "Dissilicato de lítio",
  "substrate": "Dentina saudável",
  "substrateCondition": "Saudável",
  "aestheticGoals": "Resultado natural",
  "dsdContext": {
    "currentIssue": "Diastema e proporção inadequada",
    "proposedChange": "Laminados cerâmicos",
    "observations": ["Golden ratio 72%"]
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `evaluationId` | string | Yes | UUID |
| `teeth` | string[] | Yes | Array of FDI numbers |
| `shade` | string | Yes | Ceramic shade (VITA) |
| `ceramicType` | string | No | Default `"Dissilicato de lítio"` |
| `substrate` | string | Yes | Abutment substrate description |
| `substrateCondition` | string | No | Substrate condition |
| `aestheticGoals` | string | No | Sanitized before prompt |
| `dsdContext` | object | No | DSD context for consistency |

**Success (200):**

```json
{
  "success": true,
  "protocol": {
    "preparation_steps": [
      { "order": 1, "step": "Profilaxia", "material": "Pedra-pomes + escova Robinson", "technique": "Baixa rotação" }
    ],
    "ceramic_treatment": [
      { "order": 1, "step": "Condicionamento", "material": "Ácido fluorídrico 5%", "time": "20 segundos" }
    ],
    "tooth_treatment": [
      { "order": 1, "step": "Condicionamento ácido", "material": "Ácido fosfórico 37%", "time": "15 segundos" }
    ],
    "cementation": {
      "cement_type": "fotopolimerizável",
      "cement_brand": "Allcem APS",
      "shade": "Translúcido",
      "light_curing_time": "20 segundos por face",
      "technique": "Aplicar fina camada no laminado, assentar com pressão digital..."
    },
    "finishing": [
      { "order": 1, "step": "Remoção de excessos", "material": "Lâmina 12", "technique": "Antes da polimerização final" }
    ],
    "post_operative": ["Verificar oclusão em MIH e lateralidade"],
    "checklist": ["Isolamento adequado", "Prova seca antes da cimentação"],
    "alerts": [],
    "warnings": [],
    "confidence": "alta"
  }
}
```

**DB updates:** Saves `cementation_protocol` and sets `treatment_type: "porcelana"` on the evaluation.

---

## Billing Functions

### stripe-webhook

`POST /functions/v1/stripe-webhook`

Processes Stripe webhook events. Authenticated via Stripe signature (not Bearer token).

**Header:** `stripe-signature: <signature>`

**Handled events:**

| Event | Action |
|-------|--------|
| `checkout.session.completed` | New subscription or credit pack purchase |
| `customer.subscription.updated` | Plan change |
| `customer.subscription.deleted` | Cancellation |
| `invoice.paid` | Payment received (renewal) |
| `invoice.payment_failed` | Payment failure |

**Credit pack processing:** After recording purchase, calls RPC `add_bonus_credits(p_user_id, p_credits)`.

**Response:** `{ "received": true }`

---

### create-checkout-session

`POST /functions/v1/create-checkout-session`

Creates a Stripe Checkout session for subscriptions or credit pack purchases.

**Request:**

```json
{
  "priceId": "plan_id_or_stripe_price_id",
  "packId": "credit_pack_id",
  "successUrl": "https://dentai.pro/settings?tab=subscription",
  "cancelUrl": "https://dentai.pro/pricing"
}
```

Provide **either** `priceId` (subscription) **or** `packId` (credit pack), not both.

**Logic:**

| Scenario | Behavior |
|----------|----------|
| New subscription | Returns `{ sessionId, url }` — redirect to Stripe |
| Existing subscription (upgrade/downgrade) | Returns `{ updated: true }` — inline proration |
| Credit pack (requires active subscription) | Returns `{ url }` — redirect to one-time checkout |

**Errors:**

| Status | Reason |
|--------|--------|
| 400 | No `priceId` or `packId` provided |
| 400 | Credit pack without active subscription |
| 404 | Pack not found or no price configured |

---

### create-portal-session

`POST /functions/v1/create-portal-session`

Creates a Stripe Billing Portal session for self-service account management.

**Request:**

```json
{
  "returnUrl": "https://dentai.pro/settings"
}
```

**Success (200):**

```json
{
  "url": "https://billing.stripe.com/p/session/..."
}
```

Portal allows: manage payment methods, update billing info, view invoices, cancel subscription.

---

### sync-subscription

`POST /functions/v1/sync-subscription`

Fallback sync for webhook delivery issues. Called by frontend after checkout to ensure DB reflects Stripe state.

**Request:** Empty POST (no body required).

**Success (200):**

```json
{
  "synced": true,
  "plan_id": "elite",
  "status": "active",
  "stripe_price_id": "price_..."
}
```

Or if no subscription found:

```json
{
  "synced": false,
  "reason": "No Stripe customer found"
}
```

---

## Input Sanitization

All user-provided text fields (`clinicalNotes`, `aestheticGoals`, etc.) are sanitized before prompt injection via `sanitizeForPrompt()`:

- Strips markdown code blocks with system/role labels
- Removes role override patterns (`system:`, `assistant:`)
- Filters "ignore previous instructions" patterns
- Removes "act as" / "pretend" patterns
- Strips XML/HTML tags

---

## Related

- [[docs/00-Index/Home]] — Documentation Hub
- [[02-Architecture/Overview]] — System Architecture
- [[06-ADRs/ADR-003-centralized-prompt-management]] — Prompt Management ADR
- [[04-Development/Setup-Guide]] — Developer Setup
- [[05-Operations/Runbooks/Deploy-Edge-Functions]] — Deploy Runbook

---
*Updated: 2026-02-09*
