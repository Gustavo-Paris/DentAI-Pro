import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";
import type Stripe from "npm:stripe@17";
import { logger } from "../_shared/logger.ts";
import { sendEmail, paymentReceivedEmail, paymentFailedEmail } from "../_shared/email.ts";

/**
 * Resolve our internal plan ID from a Stripe price ID.
 * Falls back to the Stripe price ID if no mapping found.
 * NOTE: This is safe because the price ID comes from Stripe (trusted source),
 * not from user input. The fallback ensures webhook processing isn't blocked
 * by a missing plan mapping, but the warning log helps detect misconfigurations.
 */
export async function resolveInternalPlanId(supabase: SupabaseClient, stripePriceId: string): Promise<string> {
  const { data } = await supabase
    .from("subscription_plans")
    .select("id")
    .eq("stripe_price_id", stripePriceId)
    .maybeSingle();

  if (!data?.id) {
    logger.warn(`No subscription_plans mapping found for Stripe price_id: ${stripePriceId}. Using raw price ID as plan_id.`);
  }

  return data?.id || stripePriceId;
}

export async function handleCheckoutCompleted(
  supabase: SupabaseClient,
  session: Stripe.Checkout.Session,
  stripe: Stripe,
) {
  // Check if this is a credit pack purchase (one-time payment)
  if (session.mode === "payment" && session.metadata?.type === "credit_pack") {
    await handleCreditPackPurchase(supabase, session);
    return;
  }

  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  logger.important(`Checkout completed for customer ${customerId}, subscription ${subscriptionId}`);

  // Get the subscription details from Stripe
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  let userId = subscription.metadata.supabase_user_id;

  if (!userId) {
    // Fallback: find user by customer ID from existing subscription record
    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("user_id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();

    if (existingSub) {
      userId = existingSub.user_id;
      logger.important(`Resolved user ${userId} from customer ${customerId} (metadata missing)`);
    } else {
      logger.error(`No supabase_user_id in metadata and no existing subscription for customer ${customerId}`);
      return;
    }
  }

  // Resolve internal plan ID from Stripe price ID
  const stripePriceId = subscription.items.data[0]?.price.id;
  const planId = await resolveInternalPlanId(supabase, stripePriceId);
  logger.important(`Resolved plan: ${stripePriceId} -> ${planId}`);

  // Check if subscription row already exists
  const { data: existingSub } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  const subscriptionData = {
    stripe_customer_id: customerId,
    stripe_subscription_id: subscriptionId,
    plan_id: planId,
    status: subscription.status,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
    trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
    trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
    updated_at: new Date().toISOString(),
  };

  let error;
  if (existingSub) {
    // Update only plan-related fields — preserve credits_used, rollover, bonus
    ({ error } = await supabase
      .from("subscriptions")
      .update(subscriptionData)
      .eq("user_id", userId));
  } else {
    // New subscription — full insert
    ({ error } = await supabase
      .from("subscriptions")
      .insert({ ...subscriptionData, user_id: userId }));
  }

  if (error) {
    throw new Error(`DB error updating subscription ${subscriptionId} for user ${userId}: ${error.message}`);
  }

  logger.important(`Subscription ${subscriptionId} saved for user ${userId}`);
}

export async function handleSubscriptionUpdate(supabase: SupabaseClient, subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  let userId = subscription.metadata.supabase_user_id;

  if (!userId) {
    // Try to find user by customer ID
    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("user_id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();

    if (!existingSub) {
      logger.error(`Could not find user for subscription update. customer=${customerId}, sub=${subscription.id}`);
      return;
    }
    userId = existingSub.user_id;
  }

  const stripePriceId = subscription.items.data[0]?.price.id;
  const planId = await resolveInternalPlanId(supabase, stripePriceId);

  // Upsert to handle both new and existing subscriptions
  const { error } = await supabase
    .from("subscriptions")
    .upsert({
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      plan_id: planId,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
    }, {
      onConflict: "user_id",
    });

  if (error) {
    throw new Error(`DB error updating subscription ${subscription.id}: ${error.message}`);
  }

  logger.important(`Subscription ${subscription.id} updated to status ${subscription.status}`);
}

export async function handleSubscriptionDeleted(supabase: SupabaseClient, subscription: Stripe.Subscription) {
  const { error } = await supabase
    .from("subscriptions")
    .update({
      status: "canceled",
      canceled_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);

  if (error) {
    throw new Error(`DB error canceling subscription ${subscription.id}: ${error.message}`);
  }

  logger.important(`Subscription ${subscription.id} marked as canceled`);
}

export async function handleInvoicePaid(supabase: SupabaseClient, invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  // Find user by customer ID
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("user_id, id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (!sub) {
    logger.error("Could not find subscription for invoice");
    return;
  }

  // Record payment (upsert by stripe_invoice_id for idempotency)
  const { error } = await supabase
    .from("payment_history")
    .upsert({
      user_id: sub.user_id,
      subscription_id: sub.id,
      stripe_invoice_id: invoice.id,
      stripe_payment_intent_id: invoice.payment_intent as string,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: "succeeded",
      invoice_url: invoice.hosted_invoice_url,
      invoice_pdf: invoice.invoice_pdf,
      description: invoice.description || `Pagamento - ${invoice.lines.data[0]?.description || 'Assinatura'}`,
    }, {
      onConflict: "stripe_invoice_id",
    });

  if (error) {
    throw new Error(`DB error recording payment for invoice ${invoice.id}: ${error.message}`);
  }

  logger.important(`Payment recorded for invoice ${invoice.id}`);

  // Fire-and-forget: send payment confirmation email
  try {
    const [{ data: profile }, { data: authData }] = await Promise.all([
      supabase
        .from("profiles")
        .select("full_name")
        .eq("id", sub.user_id)
        .single(),
      supabase.auth.admin.getUserById(sub.user_id),
    ]);
    const email = authData?.user?.email;
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

export async function handleInvoiceFailed(supabase: SupabaseClient, invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("user_id, id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (!sub) {
    logger.error("Could not find subscription for failed invoice");
    return;
  }

  // Record failed payment (upsert for idempotency on webhook retry)
  const { error: historyError } = await supabase
    .from("payment_history")
    .upsert({
      user_id: sub.user_id,
      subscription_id: sub.id,
      stripe_invoice_id: invoice.id,
      amount: invoice.amount_due,
      currency: invoice.currency,
      status: "failed",
      description: `Pagamento falhou - ${invoice.lines.data[0]?.description || 'Assinatura'}`,
    }, {
      onConflict: "stripe_invoice_id",
    });

  if (historyError) {
    throw new Error(`DB error recording payment failure for invoice ${invoice.id}: ${historyError.message}`);
  }

  // Always update subscription status (independent of history insert)
  const { error: statusError } = await supabase
    .from("subscriptions")
    .update({ status: "past_due", updated_at: new Date().toISOString() })
    .eq("stripe_customer_id", customerId);

  if (statusError) {
    throw new Error(`DB error updating subscription status to past_due for customer ${customerId}: ${statusError.message}`);
  }

  logger.warn(`Payment failed for invoice ${invoice.id}`);

  // Fire-and-forget: send payment failure email
  try {
    const [{ data: profile }, { data: authData }] = await Promise.all([
      supabase
        .from("profiles")
        .select("full_name")
        .eq("id", sub.user_id)
        .single(),
      supabase.auth.admin.getUserById(sub.user_id),
    ]);
    const email = authData?.user?.email;
    const name = profile?.full_name || email?.split("@")[0] || "Usuario";
    if (email) {
      const amount = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: invoice.currency,
      }).format(invoice.amount_due / 100);
      const { subject, html } = paymentFailedEmail(name, amount);
      await sendEmail({ to: email, subject, html });
    }
  } catch (err) {
    logger.warn(`Payment failure email failed (non-blocking): ${(err as Error).message}`);
  }
}

export async function handleCreditPackPurchase(supabase: SupabaseClient, session: Stripe.Checkout.Session) {
  const userId = session.metadata?.supabase_user_id;
  const packId = session.metadata?.pack_id;
  const creditsStr = session.metadata?.credits;

  if (!userId || !packId) {
    logger.error(`Missing metadata on credit pack checkout session ${session.id}. metadata=${JSON.stringify(session.metadata)}`);
    return;
  }

  // Re-validate credit count from DB instead of trusting session metadata.
  // The credit_packs table is the authoritative source for how many credits a pack grants.
  let credits: number;
  const { data: pack, error: packError } = await supabase
    .from("credit_packs")
    .select("credits")
    .eq("id", packId)
    .single();

  if (pack?.credits && pack.credits > 0) {
    credits = pack.credits;
    // Log if metadata disagrees with DB (indicates potential tampering or stale data)
    const metadataCredits = parseInt(creditsStr || "", 10);
    if (!isNaN(metadataCredits) && metadataCredits !== credits) {
      logger.warn(
        `Credit mismatch: metadata says ${metadataCredits}, DB says ${credits} for pack ${packId}. Using DB value.`
      );
    }
  } else {
    // Fallback to metadata if DB query fails (webhook must be resilient)
    logger.warn(
      `Could not fetch pack ${packId} from credit_packs (error: ${packError?.message || "not found"}). Falling back to metadata.`
    );
    const fallback = parseInt(creditsStr || "", 10);
    if (isNaN(fallback) || fallback <= 0) {
      logger.error(`Invalid credits: DB query failed and metadata value is invalid (${creditsStr})`);
      return;
    }
    credits = fallback;
  }

  const paymentMethod = session.metadata?.payment_method || "card";
  logger.important(`Credit pack purchase: pack=${packId}, credits=${credits}, user=${userId}, payment_method=${paymentMethod}`);

  // Record purchase (upsert by stripe_session_id for idempotency)
  const { error: purchaseError } = await supabase
    .from("credit_pack_purchases")
    .upsert({
      user_id: userId,
      pack_id: packId,
      credits: credits,
      amount: session.amount_total,
      stripe_session_id: session.id,
      status: "completed",
    }, {
      onConflict: "stripe_session_id",
    });

  if (purchaseError) {
    logger.error("Error recording credit pack purchase:", purchaseError);
    return;
  }

  // Add bonus credits via SQL function
  const { error: creditError } = await supabase.rpc("add_bonus_credits", {
    p_user_id: userId,
    p_credits: credits,
  });

  if (creditError) {
    logger.error("Error adding bonus credits:", creditError);
    return;
  }

  logger.important(`Credit pack ${packId} (+${credits} credits) applied for user ${userId}`);
}
