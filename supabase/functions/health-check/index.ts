import { createClient } from "jsr:@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreFlight } from "../_shared/cors.ts";

Deno.serve(async (req: Request) => {
  const corsHeaders = { ...getCorsHeaders(req), "Content-Type": "application/json" };

  if (req.method === "OPTIONS") {
    return handleCorsPreFlight(req);
  }

  const start = Date.now();
  let dbOk = false;
  let geminiResult: Record<string, unknown> = {};

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

  const url = new URL(req.url);

  // Test Gemini simple text
  if (url.searchParams.get("gemini") === "1") {
    const apiKey = Deno.env.get("GOOGLE_AI_API_KEY");
    if (!apiKey) {
      geminiResult = { error: "GOOGLE_AI_API_KEY not set" };
    } else {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        const response = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: "Reply with just: OK" }] }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 10, thinkingConfig: { thinkingLevel: "minimal" } },
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        geminiResult = { status: response.status, ok: response.ok, body: (await response.text()).substring(0, 500), latency_ms: Date.now() - start };
      } catch (err) {
        geminiResult = { error: (err as Error).message, name: (err as Error).name };
      }
    }
  }

  // Test Gemini with function calling + tools
  if (url.searchParams.get("gemini") === "tools") {
    const apiKey = Deno.env.get("GOOGLE_AI_API_KEY");
    if (!apiKey) {
      geminiResult = { error: "GOOGLE_AI_API_KEY not set" };
    } else {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        const response = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: "The answer is 42. Return it." }] }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 100, thinkingConfig: { thinkingLevel: "low" } },
            tools: [{ functionDeclarations: [{ name: "return_answer", description: "Return the answer", parameters: { type: "object", properties: { answer: { type: "number" } }, required: ["answer"] } }] }],
            toolConfig: { functionCallingConfig: { mode: "ANY", allowedFunctionNames: ["return_answer"] } },
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        geminiResult = { status: response.status, ok: response.ok, body: (await response.text()).substring(0, 1000), latency_ms: Date.now() - start };
      } catch (err) {
        geminiResult = { error: (err as Error).message, name: (err as Error).name };
      }
    }
  }

  // Test Gemini with image + function calling (POST body must include imageBase64)
  if (url.searchParams.get("gemini") === "vision") {
    const apiKey = Deno.env.get("GOOGLE_AI_API_KEY");
    if (!apiKey) {
      geminiResult = { error: "GOOGLE_AI_API_KEY not set" };
    } else {
      try {
        let imageData = "";
        let mimeType = "image/jpeg";

        if (req.method === "POST") {
          const body = await req.json();
          const raw = body.imageBase64 || "";
          imageData = raw.includes(",") ? raw.split(",")[1] : raw;
          if (raw.includes("data:image/png")) mimeType = "image/png";
        }

        if (!imageData) {
          geminiResult = { error: "POST body must include imageBase64" };
        } else {
          const imageSizeKB = Math.round(imageData.length / 1024);
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 55000);

          const response = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [
                { text: "Describe this dental photo briefly (1 sentence)." },
                { inlineData: { mimeType, data: imageData } },
              ] }],
              generationConfig: { temperature: 0.1, maxOutputTokens: 100, thinkingConfig: { thinkingLevel: "low" } },
            }),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);
          const respText = await response.text();
          geminiResult = {
            status: response.status,
            ok: response.ok,
            imageSizeKB,
            body: respText.substring(0, 1000),
            latency_ms: Date.now() - start,
          };
        }
      } catch (err) {
        geminiResult = { error: (err as Error).message, name: (err as Error).name };
      }
    }
  }

  // Test Gemini with image + function calling + tools (full analysis simulation)
  if (url.searchParams.get("gemini") === "vision-tools") {
    const apiKey = Deno.env.get("GOOGLE_AI_API_KEY");
    if (!apiKey) {
      geminiResult = { error: "GOOGLE_AI_API_KEY not set" };
    } else {
      try {
        let imageData = "";
        let mimeType = "image/jpeg";

        if (req.method === "POST") {
          const body = await req.json();
          const raw = body.imageBase64 || "";
          imageData = raw.includes(",") ? raw.split(",")[1] : raw;
          if (raw.includes("data:image/png")) mimeType = "image/png";
        }

        if (!imageData) {
          geminiResult = { error: "POST body must include imageBase64" };
        } else {
          const imageSizeKB = Math.round(imageData.length / 1024);
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 55000);

          const toolSchema = {
            type: "object",
            properties: {
              detected: { type: "boolean" },
              confidence: { type: "number" },
              summary: { type: "string" },
            },
            required: ["detected", "confidence", "summary"],
          };

          const response = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [
                { text: "Analyze this dental photo. Use the tool to return structured results." },
                { inlineData: { mimeType, data: imageData } },
              ] }],
              generationConfig: { temperature: 0.1, maxOutputTokens: 500, thinkingConfig: { thinkingLevel: "low" } },
              tools: [{ functionDeclarations: [{ name: "analyze_dental_photo", description: "Return analysis", parameters: toolSchema }] }],
              toolConfig: { functionCallingConfig: { mode: "ANY", allowedFunctionNames: ["analyze_dental_photo"] } },
            }),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);
          const respText = await response.text();
          geminiResult = {
            status: response.status,
            ok: response.ok,
            imageSizeKB,
            body: respText.substring(0, 2000),
            latency_ms: Date.now() - start,
          };
        }
      } catch (err) {
        geminiResult = { error: (err as Error).message, name: (err as Error).name };
      }
    }
  }

  const latencyMs = Date.now() - start;
  const responseBody = {
    status: dbOk ? "ok" : "degraded",
    db: dbOk,
    latency_ms: latencyMs,
    timestamp: new Date().toISOString(),
    ...(Object.keys(geminiResult).length > 0 && { gemini: geminiResult }),
  };

  return new Response(JSON.stringify(responseBody, null, 2), {
    status: dbOk ? 200 : 503,
    headers: corsHeaders,
  });
});
