---
title: Partial Features Completion — Implementation Plan
created: 2026-02-24
updated: 2026-02-24
status: draft
tags:
  - type/plan
  - status/draft
---

# Partial Features Completion — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete the 3 partially implemented features identified in the feature audit — email automation triggers, dashboard analytics enhancements, and payment history improvements. (LGPD Data Export and Account Deletion are already 100% complete.)

**Architecture:** Incremental additions to existing hooks, components, and edge functions. No schema changes required — all database tables already exist.

**Tech Stack:** React 18 + TypeScript, Vite, Supabase Edge Functions (Deno), Resend (email), Stripe (payments), Recharts (charts), i18n (react-i18next).

---

## Feature 1: Email Automation Triggers

### Task 1: Credit Warning Email Trigger

**Fixes:** Missing trigger for low-credit warning email (template exists, no trigger code)

**Files:**
- Modify: `apps/web/src/hooks/domain/useDashboard.ts`
- Modify: `apps/web/src/data/email.ts`

**Step 1: Add credit warning trigger in useDashboard**

In `useDashboard.ts`, after the `showCreditsBanner` logic (around line 401), add a one-time email trigger when credits drop to a threshold. Use sessionStorage to avoid sending multiple times per session:

```typescript
// After the showCreditsBanner block (~line 406):
useEffect(() => {
  if (
    !loadingCredits &&
    isActive &&
    !isFree &&
    creditsRemaining > 0 &&
    creditsRemaining <= 5 &&
    creditsPerMonth > 0 &&
    !sessionStorage.getItem('credit-warning-sent')
  ) {
    sessionStorage.setItem('credit-warning-sent', 'true');
    sendEmail('credit-warning', {
      remaining: creditsRemaining,
      total: creditsPerMonth,
    }).catch(() => {}); // Fire-and-forget
  }
}, [loadingCredits, isActive, isFree, creditsRemaining, creditsPerMonth]);
```

Import `sendEmail` from `@/data/email`.

**Step 2: Commit**

```bash
git add apps/web/src/hooks/domain/useDashboard.ts
git commit -m "feat: trigger low-credit warning email when credits ≤ 5"
```

---

### Task 2: Payment Email Notifications (Invoice Paid/Failed)

**Fixes:** Stripe webhook records payments but doesn't notify users via email

**Files:**
- Modify: `supabase/functions/_shared/email.ts` (add 2 new templates)
- Modify: `supabase/functions/send-email/index.ts` (register new templates)
- Modify: `supabase/functions/stripe-webhook/index.ts` (add email triggers)

**Step 1: Add email templates**

In `supabase/functions/_shared/email.ts`, add two new template functions after `accountDeletedEmail`:

```typescript
export function paymentReceivedEmail(
  name: string,
  amount: string,
  invoiceUrl: string | null,
): { subject: string; html: string } {
  const firstName = name.split(" ")[0];
  return {
    subject: "Pagamento confirmado — ToSmile.ai",
    html: layout(`
      <h2 style="margin:0 0 16px;font-size:22px;color:${DARK};">Ola, ${firstName}</h2>
      <p style="margin:0 0 16px;font-size:15px;color:${GRAY_TEXT};line-height:1.6;">
        Seu pagamento de <strong style="color:${TEAL};">${amount}</strong> foi
        processado com sucesso no <strong>ToSmile.ai</strong>.
      </p>
      ${invoiceUrl ? `
      <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto;">
        <tr>
          <td style="background-color:${TEAL};border-radius:6px;">
            <a href="${invoiceUrl}" style="display:inline-block;padding:12px 32px;font-size:15px;font-weight:600;color:${DARK};text-decoration:none;">
              Ver fatura
            </a>
          </td>
        </tr>
      </table>` : ''}
      <p style="margin:24px 0 0;font-size:13px;color:#999;line-height:1.5;">
        Obrigado por confiar no ToSmile.ai para suas avaliacoes clinicas.
      </p>
    `),
  };
}

export function paymentFailedEmail(
  name: string,
  amount: string,
): { subject: string; html: string } {
  const firstName = name.split(" ")[0];
  return {
    subject: "Falha no pagamento — ToSmile.ai",
    html: layout(`
      <h2 style="margin:0 0 16px;font-size:22px;color:${DARK};">Ola, ${firstName}</h2>
      <p style="margin:0 0 16px;font-size:15px;color:${GRAY_TEXT};line-height:1.6;">
        Houve uma falha ao processar o pagamento de <strong style="color:#e74c3c;">${amount}</strong>.
        Sua assinatura pode ser afetada caso o pagamento nao seja regularizado.
      </p>
      <p style="margin:0 0 24px;font-size:15px;color:${GRAY_TEXT};line-height:1.6;">
        Verifique os dados do seu cartao ou entre em contato com o suporte do seu banco.
      </p>
      <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto;">
        <tr>
          <td style="background-color:${TEAL};border-radius:6px;">
            <a href="https://tosmile.ai/settings" style="display:inline-block;padding:12px 32px;font-size:15px;font-weight:600;color:${DARK};text-decoration:none;">
              Atualizar pagamento
            </a>
          </td>
        </tr>
      </table>
    `),
  };
}
```

**Step 2: Register templates in send-email edge function**

In `supabase/functions/send-email/index.ts`:
- Import the new templates
- Add `"payment-received"` and `"payment-failed"` to `VALID_TEMPLATES`
- Add switch cases for the new templates

```typescript
case "payment-received": {
  const amount = String(body.data?.amount ?? "");
  const invoiceUrl = body.data?.invoiceUrl as string | null ?? null;
  emailContent = paymentReceivedEmail(userName, amount, invoiceUrl);
  break;
}

case "payment-failed": {
  const amount = String(body.data?.amount ?? "");
  emailContent = paymentFailedEmail(userName, amount);
  break;
}
```

**Step 3: Trigger emails from stripe-webhook**

In `supabase/functions/stripe-webhook/index.ts`:
- Import `sendEmail` and the template functions from `../_shared/email.ts`
- In `handleInvoicePaid()`, after recording payment successfully (after line 296):

```typescript
// Fire-and-forget: send payment confirmation email
if (sub.user_id) {
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", sub.user_id)
      .single();
    const { data: authUser } = await supabase.auth.admin.getUserById(sub.user_id);
    const email = authUser?.user?.email;
    const name = profile?.full_name || email?.split("@")[0] || "Usuario";
    if (email) {
      const amount = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: invoice.currency,
      }).format(invoice.amount_paid / 100);
      const { subject, html } = paymentReceivedEmail(name, amount, invoice.hosted_invoice_url || null);
      await sendEmail({ to: email, subject, html });
    }
  } catch (err) {
    logger.warn(`Payment email failed (non-blocking): ${(err as Error).message}`);
  }
}
```

- In `handleInvoiceFailed()`, add similar trigger after line 343.

**Step 4: Update frontend email types**

In `apps/web/src/data/email.ts`, add the new template types:

```typescript
export type EmailTemplate =
  | 'welcome'
  | 'credit-warning'
  | 'weekly-digest'
  | 'account-deleted'
  | 'payment-received'
  | 'payment-failed';
```

**Step 5: Commit**

```bash
git add supabase/functions/_shared/email.ts supabase/functions/send-email/index.ts supabase/functions/stripe-webhook/index.ts apps/web/src/data/email.ts
git commit -m "feat: payment email notifications (received + failed) via Stripe webhook"
```

---

### Task 3: Weekly Digest — Settings Toggle + Manual Trigger

**Fixes:** Weekly digest template exists but no way to trigger it

**Files:**
- Modify: `apps/web/src/pages/Profile.tsx`
- Modify: `apps/web/src/hooks/domain/useProfile.ts`

**Step 1: Add weekly digest trigger button in Profile**

Instead of a cron job (which requires database triggers and is complex for MVP), add a "Send Weekly Summary" button in the Profile page notifications tab area. This gives users control over when to receive their digest.

In `useProfile.ts`, add a `sendWeeklyDigest()` function that calls the send-email edge function with template `weekly-digest` and current dashboard stats.

In `Profile.tsx`, add a Card in the appropriate section (or in the "privacidade" tab) with:
- Title: "Resumo Semanal"
- Description: "Receba um resumo das suas avaliações da semana por e-mail"
- Button: "Enviar Resumo" with loading state

The button calls `sendEmail('weekly-digest', { casesThisWeek, totalCases, pendingTeeth })` using data from the evaluations query.

**Step 2: Commit**

```bash
git add apps/web/src/pages/Profile.tsx apps/web/src/hooks/domain/useProfile.ts
git commit -m "feat: manual weekly digest email trigger in Profile"
```

---

## Feature 2: Dashboard Analytics Enhancements

### Task 4: Monthly Trend Selector (8 → 12 weeks configurable)

**Fixes:** Weekly trends locked at 8 weeks with no user control

**Files:**
- Modify: `apps/web/src/pages/dashboard/InsightsTab.tsx`
- Modify: `apps/web/src/hooks/domain/useDashboard.ts`

**Step 1: Add period selector to InsightsTab**

In `InsightsTab.tsx`, add a segment control above `WeeklyTrendsChart` allowing: "8 semanas" | "12 semanas" | "6 meses".

```tsx
const [period, setPeriod] = useState<8 | 12 | 26>(8);
```

Add a row of small buttons/tabs above the chart:

```tsx
<div className="flex gap-1 mb-3">
  {[8, 12, 26].map((w) => (
    <button
      key={w}
      onClick={() => setPeriod(w as 8 | 12 | 26)}
      className={cn(
        'px-3 py-1 rounded-md text-xs font-medium transition-colors',
        period === w ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
      )}
    >
      {w === 26 ? t('dashboard.insights.6months') : t('dashboard.insights.nWeeks', { count: w })}
    </button>
  ))}
</div>
```

**Step 2: Make useDashboard accept configurable weeks**

In `useDashboard.ts`, the `insightsData` query already uses `weeksBack: 8` (line 328). Make this a parameter exposed from the hook:

- Add `weeksBack` state to the hook
- Expose a `setWeeksBack` setter
- Use `weeksBack` in the query key and function call

OR simpler approach: since InsightsTab already receives the data, compute the filtered view client-side by slicing `weeklyTrends` array to the selected period length. This avoids refetching.

**Step 3: Add i18n keys**

Add `dashboard.insights.6months`, `dashboard.insights.nWeeks` to both locale files.

**Step 4: Commit**

```bash
git add apps/web/src/pages/dashboard/InsightsTab.tsx apps/web/src/hooks/domain/useDashboard.ts apps/web/src/locales/
git commit -m "feat: configurable trend period selector in dashboard insights"
```

---

### Task 5: Completion Rate Trend + Average Time Metric

**Fixes:** Dashboard lacks time-based performance metrics

**Files:**
- Modify: `apps/web/src/hooks/domain/useDashboard.ts`
- Modify: `apps/web/src/pages/dashboard/InsightsTab.tsx`
- Modify: `apps/web/src/data/evaluations.ts` (if needed for new query)

**Step 1: Compute average completion time**

In `useDashboard.ts`, inside `computeInsights()`, calculate average time between session creation and last evaluation completion:

```typescript
// After existing insights computation:
let completionTimes: number[] = [];
for (const row of rows) {
  // If row has completed_at and created_at, calculate diff in hours
  if (row.created_at) {
    const created = new Date(row.created_at).getTime();
    const now = Date.now();
    const diffHours = (now - created) / (1000 * 60 * 60);
    if (diffHours < 720) { // Only count if < 30 days
      completionTimes.push(diffHours);
    }
  }
}
const avgCompletionHours = completionTimes.length > 0
  ? Math.round(completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length)
  : null;
```

Add `avgCompletionHours: number | null` to `ClinicalInsights`.

**Step 2: Display in ClinicalStatsCard**

In `InsightsTab.tsx`, add a new row in `ClinicalStatsCard`:

```tsx
{insights.avgCompletionHours !== null && (
  <div className="flex items-center justify-between">
    <span className="text-xs text-muted-foreground">{t('dashboard.insights.avgCompletionTime')}</span>
    <span className="text-xs font-medium tabular-nums">
      {insights.avgCompletionHours < 24
        ? t('dashboard.insights.hours', { count: insights.avgCompletionHours })
        : t('dashboard.insights.days', { count: Math.round(insights.avgCompletionHours / 24) })}
    </span>
  </div>
)}
```

**Step 3: Commit**

```bash
git add apps/web/src/hooks/domain/useDashboard.ts apps/web/src/pages/dashboard/InsightsTab.tsx apps/web/src/locales/
git commit -m "feat: add average completion time metric to dashboard insights"
```

---

### Task 6: Patient Growth Summary Card

**Fixes:** No patient acquisition trend data

**Files:**
- Modify: `apps/web/src/pages/dashboard/InsightsTab.tsx`
- Modify: `apps/web/src/hooks/domain/useDashboard.ts`

**Step 1: Compute patient growth from existing data**

In `useDashboard.ts`, inside the metrics query (or as a new derived value), compute:
- Patients added this month vs last month
- Growth percentage: `((thisMonth - lastMonth) / lastMonth) * 100`

This can be derived from the `patients` data layer. Add a simple query in the metrics section:

```typescript
// In the metrics queryFn:
const patientsThisMonth = await patients.countByUserIdSince(user.id, startOfMonth(new Date()));
const patientsLastMonth = await patients.countByUserIdRange(
  user.id,
  startOfMonth(subMonths(new Date(), 1)),
  startOfMonth(new Date()),
);
```

If `countByUserIdSince` and `countByUserIdRange` don't exist, add them to `apps/web/src/data/patients.ts`.

**Step 2: Add Patient Growth card to InsightsTab**

Show a simple summary card with:
- Patients this month (number)
- Growth indicator (↑ or ↓ with percentage vs last month)
- Mini text: "X novos pacientes este mês"

**Step 3: Commit**

```bash
git add apps/web/src/hooks/domain/useDashboard.ts apps/web/src/pages/dashboard/InsightsTab.tsx apps/web/src/data/patients.ts apps/web/src/locales/
git commit -m "feat: add patient growth summary card to dashboard"
```

---

## Feature 3: Payment History Improvements

### Task 7: Payment Description Display + Invoice URL Link

**Fixes:** Payment list shows amount but not description; invoice_url exists but only invoice_pdf is linked

**Files:**
- Modify: `apps/web/src/components/pricing/PaymentHistorySection.tsx`

**Step 1: Show payment description**

In `PaymentHistorySection.tsx`, the `payment.description` field is available in the data type (`PaymentRecord` in `data/payments.ts`) but NOT displayed in the component.

Add the description below the amount:

```tsx
<div className="flex-1 min-w-0">
  <p className="text-sm font-medium">
    {formatPrice(payment.amount, payment.currency)}
  </p>
  {payment.description && (
    <p className="text-xs text-muted-foreground truncate">
      {payment.description}
    </p>
  )}
  <p className="text-xs text-muted-foreground">
    {new Date(payment.created_at).toLocaleDateString('pt-BR', { ... })}
  </p>
</div>
```

But note: the component's `PaymentRecord` interface (line 13-20) doesn't include `description`. Update it to match the data layer type:

```typescript
export interface PaymentRecord {
  id: string;
  amount: number;
  currency: string;
  status: string;
  description: string | null;
  invoice_url: string | null;
  invoice_pdf: string | null;
  created_at: string;
}
```

**Step 2: Add invoice URL link**

If `invoice_pdf` is null but `invoice_url` exists, show "Ver fatura" link to the Stripe hosted invoice page:

```tsx
{payment.invoice_pdf ? (
  <a href={payment.invoice_pdf} target="_blank" rel="noopener noreferrer" className="...">
    PDF
  </a>
) : payment.invoice_url ? (
  <a href={payment.invoice_url} target="_blank" rel="noopener noreferrer" className="...">
    {t('profile.viewInvoice')}
  </a>
) : null}
```

**Step 3: Commit**

```bash
git add apps/web/src/components/pricing/PaymentHistorySection.tsx
git commit -m "feat: show payment description + invoice URL in payment history"
```

---

### Task 8: CSV Export for Payment History

**Fixes:** No way to export payment records for accounting/tax purposes

**Files:**
- Modify: `apps/web/src/components/pricing/PaymentHistorySection.tsx`

**Step 1: Add CSV export button**

Add a "Exportar CSV" button in the CardHeader of PaymentHistorySection:

```tsx
<CardHeader className="flex flex-row items-center justify-between">
  <div>
    <CardTitle>...</CardTitle>
    <CardDescription>...</CardDescription>
  </div>
  <Button
    variant="outline"
    size="sm"
    onClick={handleExportCSV}
    className="gap-1.5"
  >
    <Download className="h-3.5 w-3.5" />
    CSV
  </Button>
</CardHeader>
```

**Step 2: Implement CSV generation**

```typescript
const handleExportCSV = useCallback(() => {
  if (!paymentRecords?.length) return;

  const header = 'Data,Valor,Moeda,Status,Descricao\n';
  const rows = paymentRecords.map((p) => {
    const date = new Date(p.created_at).toLocaleDateString('pt-BR');
    const amount = (p.amount / 100).toFixed(2);
    const desc = (p.description || '').replace(/,/g, ';');
    return `${date},${amount},${p.currency.toUpperCase()},${p.status},${desc}`;
  }).join('\n');

  const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tosmile-faturas-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}, [paymentRecords]);
```

**Step 3: Add i18n key**

Add `profile.exportCSV` to locale files.

**Step 4: Commit**

```bash
git add apps/web/src/components/pricing/PaymentHistorySection.tsx apps/web/src/locales/
git commit -m "feat: CSV export for payment history"
```

---

## Tracking Matrix

| Task | Feature | Files | Effort |
|------|---------|-------|--------|
| 1 | Email: Credit Warning | useDashboard.ts | 10 min |
| 2 | Email: Payment Notifications | email.ts, send-email, stripe-webhook | 20 min |
| 3 | Email: Weekly Digest Button | Profile.tsx, useProfile.ts | 15 min |
| 4 | Dashboard: Trend Period Selector | InsightsTab.tsx, useDashboard.ts | 15 min |
| 5 | Dashboard: Avg Completion Time | useDashboard.ts, InsightsTab.tsx | 15 min |
| 6 | Dashboard: Patient Growth Card | InsightsTab.tsx, useDashboard.ts, patients.ts | 20 min |
| 7 | Payments: Description + Invoice URL | PaymentHistorySection.tsx | 10 min |
| 8 | Payments: CSV Export | PaymentHistorySection.tsx | 10 min |

---

*Related: [[2026-02-23-production-readiness-audit.md]], [[2026-02-23-p2-quick-wins.md]]*
