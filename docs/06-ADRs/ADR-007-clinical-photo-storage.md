---
title: "ADR-007: Clinical Photo Storage"
adr_id: ADR-007
created: 2026-02-10
updated: 2026-02-10
status: accepted
deciders: Team DentAI
tags:
  - type/adr
  - status/accepted
  - domain/backend
  - domain/storage
  - domain/privacy
related:
  - "[[ADR-005-authentication-and-authorization]]"
  - "[[ADR-006-ai-integration-strategy]]"
  - "[[ADR-008-wizard-architecture-post-refactor]]"
  - "[[docs/00-Index/Home]]"
---

# ADR-007: Clinical Photo Storage

## Status

**Accepted** (2026-02-10)

## Context

AURIA processes clinical dental photos as the primary input for AI analysis. These photos contain sensitive patient health data and require:

1. **Secure storage** -- Clinical photos must not be publicly accessible.
2. **User-scoped isolation** -- Each dentist can only access their own patients' photos.
3. **Temporary access** -- Photos should be accessible via time-limited signed URLs, not permanent public links.
4. **Multiple storage needs** -- Intraoral photos (input), DSD simulations (AI-generated output), and additional photos (45-degree smile, full face) all need storage.
5. **LGPD compliance** -- Brazil's General Data Protection Law requires appropriate safeguards for health data.

## Decision

### Supabase Storage with Scoped Buckets

Use Supabase Storage with two private buckets:

| Bucket | Purpose | Content |
|--------|---------|---------|
| `clinical-photos` | Patient dental photos | Intraoral photos uploaded by dentists |
| `dsd-simulations` | AI-generated simulations | DSD simulation images created by Gemini |

### User-Scoped File Paths

All files are stored under the user's ID as a path prefix, ensuring logical isolation:

```
clinical-photos/
  {userId}/intraoral_{timestamp}.jpg

dsd-simulations/
  {userId}/dsd_{timestamp}.png
```

The upload function in the data layer (`apps/web/src/data/wizard.ts`) enforces this convention:

```typescript
export async function uploadPhoto(userId: string, blob: Blob): Promise<string> {
  const fileName = `${userId}/intraoral_${Date.now()}.jpg`;
  const { error } = await supabase.storage
    .from('clinical-photos')
    .upload(fileName, blob, { upsert: true });
  if (error) throw error;
  return fileName;
}
```

DSD simulation uploads follow the same pattern, handled server-side in the `generate-dsd` edge function:

```typescript
const fileName = `${userId}/dsd_${Date.now()}.png`;
await supabase.storage
  .from("dsd-simulations")
  .upload(fileName, binaryData, {
    contentType: "image/png",
    upsert: true,
  });
```

### Signed URLs for Access

Photos are never accessed via public URLs. The `useSignedUrl` hook (`apps/web/src/hooks/useSignedUrl.ts`) generates time-limited signed URLs:

```typescript
const { url, isLoading, error } = useSignedUrl({
  bucket: 'clinical-photos',
  path: evaluation.photo_frontal,
  expiresIn: SIGNED_URL_EXPIRY_SECONDS,
});
```

Features of the signed URL system:

- **Configurable expiration** -- Default defined in `SIGNED_URL_EXPIRY_SECONDS` constant.
- **Thumbnail support** -- Supabase image transformations for list/grid views:
  ```typescript
  useSignedUrl({
    bucket: 'clinical-photos',
    path: photoPath,
    thumbnail: { width: 200, height: 200, quality: 70, resize: 'cover' },
  });
  ```
- **Preset sizes** -- `THUMBNAIL_PRESETS.list`, `.grid`, `.small`, `.medium` for consistent thumbnail dimensions across the app.
- **Async helper** -- `getSignedUrl()` function for non-React contexts.

### Photo Upload in Wizard Flow

The wizard captures photos at step 0 (photo capture) and uploads them during the analysis step:

1. User captures/uploads an intraoral photo (stored as base64 in state).
2. The photo is sent as base64 to the `analyze-dental-photo` edge function for AI analysis.
3. The photo blob is uploaded to `clinical-photos/{userId}/intraoral_{timestamp}.jpg`.
4. The storage path is saved in the `evaluations.photo_frontal` column for later retrieval.

Additional photos (45-degree smile, full face) are sent as base64 directly to the `generate-dsd` edge function but are not separately persisted in storage -- they are only used during the DSD analysis session.

### DSD Simulation Storage

DSD simulations are generated server-side by the `generate-dsd` edge function and uploaded directly to the `dsd-simulations` bucket. The simulation URL path is stored in `evaluations.dsd_simulation_url`.

Multi-layer simulations (restorations-only, whitening+restorations, complete treatment) are stored as separate files and tracked in `evaluations.dsd_simulation_layers` as a JSON array:

```json
[
  { "type": "restorations-only", "simulation_url": "userId/dsd_123.png" },
  { "type": "whitening-restorations", "simulation_url": "userId/dsd_456.png" }
]
```

### LGPD Considerations

> [!warning] Health Data Classification
> Under LGPD (Lei Geral de Protecao de Dados), dental photos are classified as sensitive personal data (dados pessoais sensiveis). The following safeguards are in place:

- **No public access** -- Both buckets are private; access requires authentication.
- **User-scoped paths** -- Physical path isolation prevents cross-user access even if RLS is misconfigured.
- **Signed URLs with expiration** -- Temporary access tokens prevent link sharing.
- **No third-party storage** -- Photos remain within the Supabase infrastructure (hosted in the project's region).
- **Patient consent** -- The clinical workflow implies informed consent for photo capture and AI processing.

## Alternatives Considered

### 1. Store Photos as Base64 in the Database

- **Pros:** Simpler architecture, no separate storage service, atomic with evaluation data
- **Cons:** Bloats database rows (photos are 1-10 MB each), slows queries, PostgreSQL not optimized for binary blobs
- **Rejected because:** Database storage is 5-10x more expensive than object storage and degrades query performance.

### 2. External Storage (AWS S3, Cloudflare R2)

- **Pros:** Cheaper at scale, CDN integration, more configuration options
- **Cons:** Additional service to manage, cross-service auth complexity, data residency concerns for LGPD
- **Rejected because:** Supabase Storage integrates natively with RLS and auth. Using external storage would require building a custom signed URL service and managing cross-service credentials.

### 3. Client-Side Encryption Before Upload

- **Pros:** End-to-end encryption, even Supabase cannot read the photos
- **Cons:** Complex key management, cannot generate thumbnails server-side, breaks AI analysis (edge functions need raw image data)
- **Rejected because:** AI analysis requires raw image data. Client-side encryption would prevent the core feature from working.

## Consequences

### Positive

- **Security by default** -- Private buckets + signed URLs ensure photos are never publicly accessible.
- **Integrated auth** -- Supabase Storage uses the same auth system as the rest of the platform.
- **Cost-effective** -- Object storage is significantly cheaper than database storage for binary data.
- **Thumbnail support** -- Built-in image transformations reduce frontend complexity.

### Negative

- **Signed URL expiration** -- Users may encounter expired URLs in long-lived tabs; the hook re-fetches but adds latency.
- **No CDN** -- Supabase Storage is not a CDN; large photos may load slowly for users far from the Supabase region.
- **Additional photos not persisted** -- 45-degree and face photos are transient; if the DSD analysis needs to be re-run, the user must re-upload them.

### Risks

- **Storage costs at scale** -- Mitigated by JPEG compression and reasonable file size limits (10 MB max validated server-side).
- **Data deletion compliance** -- LGPD right-to-deletion (direito ao esquecimento) requires a mechanism to delete all photos for a given patient. Currently manual via Supabase dashboard.

## Implementation

Key files:

- `apps/web/src/data/wizard.ts` -- `uploadPhoto()` and `downloadPhoto()` functions
- `apps/web/src/hooks/useSignedUrl.ts` -- Signed URL hook with thumbnail support
- `supabase/functions/generate-dsd/index.ts` -- DSD simulation upload to `dsd-simulations` bucket
- `supabase/functions/analyze-dental-photo/index.ts` -- Photo validation (format, size, magic bytes)

## Links

- [[ADR-005-authentication-and-authorization]] -- Auth system that secures storage access
- [[ADR-006-ai-integration-strategy]] -- AI functions that consume stored photos
- [[ADR-008-wizard-architecture-post-refactor]] -- Wizard flow that captures and uploads photos
- [[ADR-Index]] -- ADR Index

---
*Created: 2026-02-10 | Last updated: 2026-02-10*
