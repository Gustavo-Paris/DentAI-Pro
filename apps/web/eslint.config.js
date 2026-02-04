import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  // Prevent direct Supabase imports in pages and domain hooks.
  // All data access should go through src/data/ (data client layer).
  // Out-of-scope pages (auth, landing, result, shared, pricing, profile) are excluded.
  {
    files: ["src/pages/**/*.{ts,tsx}", "src/hooks/domain/**/*.{ts,tsx}"],
    ignores: [
      // Auth pages — use supabase.auth directly (out of scope for data layer)
      "src/pages/ForgotPassword.tsx",
      "src/pages/ResetPassword.tsx",
      "src/pages/Login.tsx",
      "src/pages/Register.tsx",
      // Public/custom pages — out of scope for PageShell migration
      "src/pages/Landing.tsx",
      "src/pages/SharedEvaluation.tsx",
      "src/pages/Result.tsx",
      "src/pages/Evaluation.tsx",
      // Pages with complex supabase usage (future refactor)
      "src/pages/Profile.tsx",
      "src/pages/Pricing.tsx",
      // Wizard has legitimate orchestration needs (storage, edge functions)
      "src/hooks/domain/useWizardFlow.ts",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/integrations/supabase/*", "**/integrations/supabase/*"],
              message:
                "Pages and domain hooks must not import Supabase directly. Use the data client layer (src/data/) instead.",
            },
          ],
        },
      ],
    },
  },
);
