import { createClient } from "jsr:@supabase/supabase-js@2";
import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "npm:stripe@14.14.0";
import { logger } from "../_shared/logger.ts";
import { sendEmail, paymentReceivedEmail, paymentFailedEmail } from "../_shared/email.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";

/**
 * Resolve our internal plan ID from a Stripe price ID.
 * Falls back to the Stripe price ID if no mapping found.
 */
async function resolveInternalPlanId(supabase: SupabaseClient, stripePriceId: string): Promise<string> {
  const { data } = await supabase
    .from("subscription_plans")
    .select("id")
    .eq("stripe_price_id", stripePriceId)
    .maybeSingle();

  return data?.id || stripePriceId;
}

Deno.serve(async (req: Request) => {
  // Only allow POST
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Fail-fast: reject all webhooks if secret is not configured
  if (!WEBHOOK_SECRET) {
    logger.error("STRIPE_WEBHOOK_SECRET is not configured — rejecting all webhooks");
    return new Response("Webhook secret not configured", { status: 503 });
  }

  try {
    // Get the signature from headers
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      logger.error("No Stripe signature found");
      return new Response("No signature", { status: 400 });
    }

    // Get the raw body
    const body = await req.text();

    // Verify the webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET);
    } catch (err) {
      logger.error("Webhook signature verification failed:", err);
      return new Response("Invalid signature", { status: 400 });
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    logger.important(`Processing webhook event: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(supabase, session);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(supabase, subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(supabase, subscription);
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(supabase, invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoiceFailed(supabase, invoice);
        break;
      }

      default:
        logger.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    logger.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: "Erro ao processar webhook" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

async function handleCheckoutCompleted(supabase: SupabaseClient, session: Stripe.Checkout.Session) {
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
    logger.error("Error updating subscription:", error);
  } else {
    logger.important(`Subscription ${subscriptionId} saved for user ${userId}`);
  }
}

async function handleSubscriptionUpdate(supabase: SupabaseClient, subscription: Stripe.Subscription) {
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
    logger.error("Error updating subscription:", error);
  } else {
    logger.important(`Subscription ${subscription.id} updated to status ${subscription.status}`);
  }
}

async function handleSubscriptionDeleted(supabase: SupabaseClient, subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  const { error } = await supabase
    .from("subscriptions")
    .update({
      status: "canceled",
      canceled_at: new Date().toISOString(),
    })
    .eq("stripe_customer_id", customerId);

  if (error) {
    logger.error("Error canceling subscription:", error);
  } else {
    logger.important(`Subscription ${subscription.id} marked as canceled`);
  }
}

async function handleInvoicePaid(supabase: SupabaseClient, invoice: Stripe.Invoice) {
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
    logger.error("Error recording payment:", error);
  } else {
    logger.important(`Payment recorded for invoice ${invoice.id}`);
  }

  // Fire-and-forget: send payment confirmation email
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", sub.user_id)
      .single();
    const { data: authData } = await supabase.auth.admin.getUserById(sub.user_id);
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

async function handleInvoiceFailed(supabase: SupabaseClient, invoice: Stripe.Invoice) {
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
    logger.error(`Failed to record payment failure: ${historyError.message}`);
  }

  // Always update subscription status (independent of history insert)
  const { error: statusError } = await supabase
    .from("subscriptions")
    .update({ status: "past_due", updated_at: new Date().toISOString() })
    .eq("stripe_customer_id", customerId);

  if (statusError) {
    logger.error(`Failed to update subscription status: ${statusError.message}`);
  }

  logger.warn(`Payment failed for invoice ${invoice.id}`);

  // Fire-and-forget: send payment failure email
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", sub.user_id)
      .single();
    const { data: authData } = await supabase.auth.admin.getUserById(sub.user_id);
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

async function handleCreditPackPurchase(supabase: SupabaseClient, session: Stripe.Checkout.Session) {
  const userId = session.metadata?.supabase_user_id;
  const packId = session.metadata?.pack_id;
  const creditsStr = session.metadata?.credits;

  if (!userId || !packId || !creditsStr) {
    logger.error(`Missing metadata on credit pack checkout session ${session.id}. metadata=${JSON.stringify(session.metadata)}`);
    return;
  }

  const credits = parseInt(creditsStr, 10);
  if (isNaN(credits) || credits <= 0) {
    logger.error(`Invalid credits value in metadata: ${creditsStr}`);
    return;
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
