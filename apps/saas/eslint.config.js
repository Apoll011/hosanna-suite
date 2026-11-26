// SPDX-License-Identifier: AGPL-3.0-only
import shared from "@hosanna/config/eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(...shared, {
  files: ["src/**/*.{js,ts,jsx,tsx}"],
  languageOptions: { globals: globals.browser },
  plugins: { "react-hooks": reactHooks, "react-refresh": reactRefresh },
  rules: {
    ...reactHooks.configs.recommended.rules,
    "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
  },
});
