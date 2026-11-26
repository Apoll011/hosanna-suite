// SPDX-License-Identifier: AGPL-3.0-only
import js from "@eslint/js";
import eslintPluginPrettier from "eslint-plugin-prettier/recommended";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/coverage/**",
      "**/.next/**",
      "**/.output/**",
      "**/.agents/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "no-empty": ["error", { allowEmptyCatch: true }],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          varsIgnorePattern: "^_",
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
    },
  },
  eslintPluginPrettier,
);
