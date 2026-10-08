/* eslint.tools.config.mjs — lint scope for _workspace review/annotation
 * tooling (design-review scripts, preview harnesses). Kept separate from
 * the product lint (eslint.config.mjs) so product errors are never
 * diluted by tool noise — but the tooling stays checked, not suppressed:
 * real problems (unused results, useless assignments, syntax) still
 * report. CommonJS require() is allowed here — these are Node/browser
 * harness scripts, not shipped modules.
 *
 *   npm run lint:tools
 */
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import nextPlugin from "@next/eslint-plugin-next";

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["_workspace/**/*.{js,mjs,cjs,ts,tsx,jsx}"],
    plugins: { "@next/next": nextPlugin },
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    rules: {
      "no-undef": "off", // TS handles this better
      "no-console": "off",
      /* review scripts legitimately use require() (playwright harnesses,
         preview servers) — not a product-import violation here */
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-unused-expressions": "off",
    },
  },
  {
    ignores: [
      "node_modules/",
      ".next/",
      "**/node_modules/**",
      "**/*.png",
      "**/*.json",
    ],
  },
];
