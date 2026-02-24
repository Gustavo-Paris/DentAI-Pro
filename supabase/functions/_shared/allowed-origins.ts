/**
 * Allowed redirect origins for Stripe checkout/portal sessions.
 * Prevents open-redirect attacks by validating success/cancel/return URLs
 * against this whitelist.
 */
export const ALLOWED_ORIGINS = [
  "https://tosmile.ai",
  "https://www.tosmile.ai",
  "https://dentai.pro",
  "https://www.dentai.pro",
  "https://tosmile-ai.vercel.app",
  "https://auria-ai.vercel.app",
  "https://dentai-pro.vercel.app",
];
