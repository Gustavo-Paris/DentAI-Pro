---
title: "Runbook: [Title]"
created: YYYY-MM-DD
updated: YYYY-MM-DD
owner: Team AURIA
severity: P1 | P2 | P3
tags:
  - type/runbook
  - status/draft
related:
  - "[[docs/00-Index/Home]]"
---

# Runbook: [Title]

> [!warning] Severity
> **[P1/P2/P3]** — [One-line impact description]

---

## Overview

<!-- When to use this runbook. What problem does it address? -->

---

## Prerequisites

- Access to [system/tool]
- Permissions: [required permissions]
- Tools: [required CLI tools]

---

## Symptoms

- [ ] Symptom 1 (how to identify)
- [ ] Symptom 2
- [ ] Symptom 3

---

## Diagnosis Steps

### 1. [Check Name]

```bash
# Command to check status
```

**Expected output:** [description of healthy state]

**If abnormal:** [what it means, next step]

### 2. [Check Name]

```bash
# Command to check
```

**Look for:** [error patterns, key indicators]

---

## Resolution Steps

### Scenario A: [Description]

1. **[Action]:**
   ```bash
   command here
   ```

2. **[Action]:**
   ```bash
   command here
   ```

3. **Verify:**
   ```bash
   command to confirm resolution
   ```

### Scenario B: [Description]

1. **[Action]:** ...

---

## Rollback

> [!danger] Use with caution
> Only proceed if resolution steps fail.

**Triggers:** [When to rollback — metrics, error rates, time limits]

**Steps:**
1. [Step 1]
2. [Step 2]

**Validation:** [How to confirm rollback succeeded]

---

## Post-Incident

- [ ] Update incident ticket
- [ ] Notify stakeholders
- [ ] Schedule post-mortem if P1/P2
- [ ] Update this runbook with lessons learned

---

## Escalation

| Level | Contact | When |
|-------|---------|------|
| L1 | On-call dev | First response |
| L2 | Team lead | After 30 min |
| L3 | Engineering manager | After 1 hour |

---

## Related

- [[docs/00-Index/Home]] — Documentation Hub

---
*Created: YYYY-MM-DD | Last updated: YYYY-MM-DD*
