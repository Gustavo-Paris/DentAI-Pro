---
title: "API: [Endpoint Name]"
created: YYYY-MM-DD
updated: YYYY-MM-DD
author: Team AURIA
status: draft
tags:
  - type/api
  - status/draft
related:
  - "[[docs/00-Index/Home]]"
  - "[[03-API/Edge-Functions]]"
---

# [HTTP_METHOD] /functions/v1/[endpoint-path]

<!-- Brief description of what this endpoint does. -->

---

## Overview

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Path** | `/functions/v1/[endpoint-path]` |
| **Auth** | Bearer token / Webhook signature / None |
| **Rate Limit** | AI_HEAVY / AI_LIGHT / None |
| **Credits** | [cost] or None |

---

## Request

### Headers

| Header | Required | Description |
|--------|----------|-------------|
| `Authorization` | Yes | `Bearer <supabase_auth_jwt>` |
| `Content-Type` | Yes | `application/json` |

### Body

```json
{
  "field1": "string",
  "field2": 123,
  "optional_field": "value"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `field1` | string | Yes | Description |
| `field2` | number | Yes | Description |
| `optional_field` | string | No | Description |

---

## Response

### Success (200)

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "result": "value"
  }
}
```

### Errors

| Status | Code | Reason |
|--------|------|--------|
| 400 | `INVALID_REQUEST` | Validation failed |
| 401 | `UNAUTHORIZED` | Missing/invalid token |
| 402 | `INSUFFICIENT_CREDITS` | Not enough credits |
| 429 | `RATE_LIMITED` | Rate limit exceeded |
| 500 | `PROCESSING_ERROR` | Unexpected server error |

---

## Database Updates

<!-- What tables/columns are modified on success? -->

| Table | Columns Updated |
|-------|----------------|
| `[table_name]` | `col1`, `col2` |

---

## Examples

### cURL

```bash
curl -X POST \
  'https://<project-id>.supabase.co/functions/v1/[endpoint-path]' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "field1": "value",
    "field2": 123
  }'
```

### TypeScript (Supabase Client)

```typescript
const { data, error } = await supabase.functions.invoke('[endpoint-path]', {
  body: {
    field1: 'value',
    field2: 123,
  },
});
```

---

## Notes

<!-- Implementation details, edge cases, known limitations. -->

---

## Related

- [[03-API/Edge-Functions]] — API Reference
- [[docs/00-Index/Home]] — Documentation Hub

---
*Created: YYYY-MM-DD | Last updated: YYYY-MM-DD*
