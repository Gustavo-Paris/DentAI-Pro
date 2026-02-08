import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS" },
    });
  }

  const start = Date.now();
  let dbOk = false;

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { error } = await supabase.from("profiles").select("id").limit(1);
    dbOk = !error;
  } catch {
    dbOk = false;
  }

  const latencyMs = Date.now() - start;

  const body = {
    status: dbOk ? "ok" : "degraded",
    db: dbOk,
    latency_ms: latencyMs,
    timestamp: new Date().toISOString(),
  };

  return new Response(JSON.stringify(body), {
    status: dbOk ? 200 : 503,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
});
