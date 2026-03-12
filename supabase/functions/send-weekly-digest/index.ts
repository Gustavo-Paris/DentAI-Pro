/**
 * Weekly Digest Edge Function
 *
 * Sends weekly usage digest emails to all active users.
 * Called via pg_cron + pg_net every Monday at 10:00 UTC.
 *
 * Security: Validates Bearer token against SUPABASE_SERVICE_ROLE_KEY.
 * The SQL trigger function (trigger_weekly_digest) reads the service role key
 * from vault.decrypted_secrets and passes it as the Authorization header.
 * This requires no additional secret management beyond what Supabase already provides.
 */

import { createClient } from "jsr:@supabase/supabase-js@2";
import { logger } from "../_shared/logger.ts";
import { sendEmail, weeklyDigestEmail } from "../_shared/email.ts";

const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Verify the caller is the internal pg_cron job.
  // The SQL trigger reads the service_role_key from Vault and passes it as
  // a Bearer token. Random external callers won't have this key.
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();
  if (!SERVICE_ROLE_KEY || token !== SERVICE_ROLE_KEY) {
    logger.error("send-weekly-digest: unauthorized");
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") || "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
  );

  // Get all active users with subscriptions
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: users, error: usersError } = await supabase
    .from("subscriptions")
    .select("user_id")
    .in("status", ["active", "trialing"]);

  if (usersError || !users?.length) {
    logger.log(`send-weekly-digest: no active users found (error: ${usersError?.message || "none"})`);
    return new Response(JSON.stringify({ sent: 0 }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  let sent = 0;
  let failed = 0;

  for (const { user_id } of users) {
    try {
      // Get user email and name
      const { data: authData } = await supabase.auth.admin.getUserById(user_id);
      const email = authData?.user?.email;
      if (!email) continue;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user_id)
        .maybeSingle();

      const name = profile?.full_name || authData?.user?.user_metadata?.full_name || email.split("@")[0];

      // Count cases this week
      const { count: casesThisWeek } = await supabase
        .from("evaluations")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user_id)
        .gte("created_at", oneWeekAgo);

      // Count total cases
      const { count: totalCases } = await supabase
        .from("evaluations")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user_id);

      // Count pending teeth (evaluations without completed protocols, last 30 days).
      // The 30-day window prevents inactive users with old unresolved evaluations
      // from receiving weekly emails.
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { count: pendingTeeth } = await supabase
        .from("evaluations")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user_id)
        .is("protocol", null)
        .gte("created_at", thirtyDaysAgo);

      const stats = {
        casesThisWeek: casesThisWeek || 0,
        totalCases: totalCases || 0,
        pendingTeeth: pendingTeeth || 0,
      };

      // Skip if user had zero activity and zero pending
      if (stats.casesThisWeek === 0 && stats.pendingTeeth === 0) continue;

      const { subject, html } = weeklyDigestEmail(name, stats);
      await sendEmail({ to: email, subject, html });
      sent++;
    } catch (err) {
      logger.warn(`Weekly digest failed for user ${user_id}: ${(err as Error).message}`);
      failed++;
    }
  }

  logger.important(`send-weekly-digest: sent=${sent}, failed=${failed}, total_users=${users.length}`);

  return new Response(
    JSON.stringify({ sent, failed, total: users.length }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
});
