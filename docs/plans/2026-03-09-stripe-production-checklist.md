# Stripe Production Checklist

> Passos manuais para migrar pagamentos de homologação → produção.

**Pré-requisito:** Os commits de código (allowed-origins, CORS, migration 053) já foram feitos.

---

## 1. Stripe Dashboard — Criar Produtos e Preços (Live)

No [Stripe Dashboard](https://dashboard.stripe.com) em **modo live**, criar:

### Assinaturas (mensal)

| Plano     | Preço Mensal | Moeda |
|-----------|-------------|-------|
| Essencial | R$29,90     | BRL   |
| Pro       | R$99,00     | BRL   |
| Elite     | R$249,00    | BRL   |

### Assinaturas (anual)

| Plano     | Preço Anual  | Moeda |
|-----------|-------------|-------|
| Essencial | R$299,00    | BRL   |
| Pro       | R$990,00    | BRL   |
| Elite     | R$2.490,00  | BRL   |

### Credit Packs (pagamento único)

| Pack    | Preço  | Créditos |
|---------|--------|----------|
| pack_10 | R$39   | 10       |
| pack_25 | R$79   | 25       |
| pack_50 | R$129  | 50       |

**Anotar todos os `price_*` IDs gerados.**

---

## 2. Banco de Produção — Atualizar Price IDs

Rodar SQL no banco de produção (Supabase SQL Editor) substituindo pelos IDs live:

```sql
-- Assinaturas mensais
UPDATE subscription_plans SET stripe_price_id = 'price_LIVE_ESSENCIAL_MONTHLY' WHERE id = 'price_essencial_monthly';
UPDATE subscription_plans SET stripe_price_id = 'price_LIVE_PRO_MONTHLY' WHERE id = 'price_pro_monthly_v2';
UPDATE subscription_plans SET stripe_price_id = 'price_LIVE_ELITE_MONTHLY' WHERE id = 'price_elite_monthly';

-- Assinaturas anuais
UPDATE subscription_plans SET stripe_price_id_yearly = 'price_LIVE_ESSENCIAL_YEARLY' WHERE id = 'price_essencial_monthly';
UPDATE subscription_plans SET stripe_price_id_yearly = 'price_LIVE_PRO_YEARLY' WHERE id = 'price_pro_monthly_v2';
UPDATE subscription_plans SET stripe_price_id_yearly = 'price_LIVE_ELITE_YEARLY' WHERE id = 'price_elite_monthly';

-- Credit packs
UPDATE credit_packs SET stripe_price_id = 'price_LIVE_PACK_10' WHERE id = 'pack_10';
UPDATE credit_packs SET stripe_price_id = 'price_LIVE_PACK_25' WHERE id = 'pack_25';
UPDATE credit_packs SET stripe_price_id = 'price_LIVE_PACK_50' WHERE id = 'pack_50';
```

---

## 3. Supabase Secrets — Chaves Live

```bash
# No terminal, com o projeto linkado ao projeto de PRODUÇÃO:
supabase secrets set STRIPE_SECRET_KEY=sk_live_XXXXX --project-ref <PROD_PROJECT_ID>
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_live_XXXXX --project-ref <PROD_PROJECT_ID>
```

---

## 4. Vercel — Publishable Key

```bash
# Setar para production environment no Vercel:
echo "pk_live_XXXXX" | npx vercel env add VITE_STRIPE_PUBLISHABLE_KEY production
```

Ou via Vercel Dashboard > Settings > Environment Variables.

---

## 5. Stripe Dashboard — Webhook Endpoint

1. Ir em **Developers > Webhooks > Add endpoint**
2. URL: `https://<SUPABASE_PROJECT>.supabase.co/functions/v1/stripe-webhook`
3. Eventos a registrar:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `invoice.payment_action_required`
4. Copiar o **Signing secret** (`whsec_live_...`) e usar no passo 3

---

## 6. Stripe Dashboard — Habilitar PIX

1. Ir em **Settings > Payment methods**
2. Habilitar **PIX** (Brasil)
3. PIX só funciona para credit packs (pagamento único), não assinaturas

---

## 7. Stripe Dashboard — Billing Portal

1. Ir em **Settings > Billing > Customer portal**
2. Configurar:
   - Permitir cancelamento
   - Permitir troca de plano
   - Mostrar histórico de faturas
   - Permitir atualização de método de pagamento

---

## 8. Deploy Edge Functions

Após configurar secrets, fazer deploy das 5 edge functions de pagamento:

```bash
# Docker Desktop deve estar rodando
open -a Docker

# Deploy sequencial (NUNCA paralelo)
for fn in create-checkout-session stripe-webhook create-portal-session sync-subscription sync-credit-purchase; do
  npx supabase functions deploy $fn --no-verify-jwt --use-docker --project-ref <PROD_PROJECT_ID>
done
```

---

## 9. Smoke Test em Produção

1. Criar conta nova em produção
2. Assinar plano Essencial (usar cartão real ou Stripe test clock se disponível)
3. Verificar:
   - [ ] Checkout redireciona corretamente
   - [ ] Webhook processa `checkout.session.completed`
   - [ ] `subscriptions` table atualizada com status `active`
   - [ ] Email de confirmação enviado
   - [ ] Portal de billing acessível
   - [ ] Compra de credit pack funciona
   - [ ] PIX gera QR code (se habilitado)
   - [ ] Upgrade de plano funciona (proration)
   - [ ] Cancelamento funciona
   - [ ] Banner de `past_due` aparece quando pagamento falha

---

*Criado: 2026-03-09*
