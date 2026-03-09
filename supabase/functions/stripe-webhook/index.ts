import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "npm:stripe@17";
import { logger } from "../_shared/logger.ts";
import {
  handleCheckoutCompleted,
  handleSubscriptionUpdate,
  handleSubscriptionDeleted,
  handleInvoicePaid,
  handleInvoiceFailed,
  handlePaymentActionRequired,
} from "./webhook-handlers.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2025-02-24.acacia",
  httpClient: Stripe.createFetchHttpClient(),
});

const WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";

Deno.serve(async (req: Request) => {
  // Only allow POST
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Fail-fast: reject all webhooks if secret is not configured
  if (!WEBHOOK_SECRET) {
    logger.error("STRIPE_WEBHOOK_SECRET is not configured — rejecting all webhooks");
    return new Response("Service unavailable", { status: 503 });
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

    // --- Idempotency check ---
    const { data: existing } = await supabase
      .from("webhook_events")
      .select("id")
      .eq("stripe_event_id", event.id)
      .maybeSingle();

    if (existing) {
      logger.log(`Webhook event ${event.id} already processed — skipping`);
      return new Response(JSON.stringify({ already_processed: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Record event as processing
    const { error: insertError } = await supabase
      .from("webhook_events")
      .insert({
        stripe_event_id: event.id,
        event_type: event.type,
        status: "processing",
        payload: event.data.object as unknown as Record<string, unknown>,
      });

    if (insertError) {
      // Unique constraint violation = another instance is already processing
      if (insertError.code === "23505") {
        logger.log(`Webhook event ${event.id} already being processed (concurrent) — skipping`);
        return new Response(JSON.stringify({ already_processed: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      logger.error(`Failed to insert webhook_events row for ${event.id}:`, insertError);
    }

    logger.important(`Processing webhook event: ${event.type} (${event.id})`);

    // Handle different event types
    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          await handleCheckoutCompleted(supabase, session, stripe, event.id);
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
          await handleInvoicePaid(supabase, invoice, event.id);
          break;
        }

        case "invoice.payment_failed": {
          const invoice = event.data.object as Stripe.Invoice;
          await handleInvoiceFailed(supabase, invoice, event.id);
          break;
        }

        case "invoice.payment_action_required": {
          const invoice = event.data.object as Stripe.Invoice;
          await handlePaymentActionRequired(supabase, invoice, event.id);
          break;
        }

        default:
          logger.log(`Unhandled event type: ${event.type}`);
      }

      // Mark as processed
      await supabase
        .from("webhook_events")
        .update({ status: "processed" })
        .eq("stripe_event_id", event.id);
    } catch (handlerError) {
      // Mark as failed
      await supabase
        .from("webhook_events")
        .update({ status: "failed" })
        .eq("stripe_event_id", event.id);
      throw handlerError;
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
