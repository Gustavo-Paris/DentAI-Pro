/**
 * Prompt-injection sanitisation functions.
 *
 * Copied from supabase/functions/_shared/validation.ts (lines 16-68) so they
 * can be imported in the Vitest test suite without Deno-specific resolution.
 *
 * Keep in sync with the canonical implementation in the edge functions.
 */

/**
 * Strips known prompt-injection patterns from free-text user input before it
 * is interpolated into an LLM prompt.
 *
 * This is a defence-in-depth layer -- the main defence is the prompt structure
 * itself (system vs user messages), but sanitising removes the most obvious
 * attack vectors for instruction override / context hijacking.
 */
export function sanitizeForPrompt(input: string): string {
  if (!input) return input;

  let sanitized = input;

  // Remove markdown-style system/instruction blocks
  sanitized = sanitized.replace(/```(?:system|instruction|prompt)[\s\S]*?```/gi, "");

  // Remove explicit role/instruction override patterns
  sanitized = sanitized.replace(
    /(?:^|\n)\s*(?:system|assistant|user|instruction|role)\s*:/gi,
    "",
  );

  // Remove "ignore previous" / "forget" patterns
  sanitized = sanitized.replace(
    /(?:ignore|forget|disregard|override|bypass)\s+(?:all\s+)?(?:previous|above|prior|earlier)\s+(?:instructions?|context|prompts?|rules?)/gi,
    "[removed]",
  );

  // Remove "you are now" / "act as" / "pretend" override patterns
  sanitized = sanitized.replace(
    /(?:you\s+are\s+now|act\s+as|pretend\s+(?:to\s+be|you\s+are)|from\s+now\s+on\s+you\s+are)/gi,
    "[removed]",
  );

  // Remove XML/HTML-like injection tags
  sanitized = sanitized.replace(/<\/?(?:system|instruction|prompt|context|role)[^>]*>/gi, "");

  // Collapse excessive whitespace introduced by removals
  sanitized = sanitized.replace(/\n{3,}/g, "\n\n").trim();

  return sanitized;
}

/**
 * Sanitise a Record of string fields that will be interpolated into prompts.
 * Non-string values are returned as-is; string values are passed through
 * `sanitizeForPrompt`.
 */
export function sanitizeFieldsForPrompt<T extends Record<string, unknown>>(
  data: T,
  fields: (keyof T)[],
): T {
  const copy = { ...data };
  for (const key of fields) {
    const val = copy[key];
    if (typeof val === "string") {
      (copy as Record<string, unknown>)[key as string] = sanitizeForPrompt(val);
    }
  }
  return copy;
}
