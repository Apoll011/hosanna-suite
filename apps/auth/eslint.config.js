// SPDX-License-Identifier: AGPL-3.0-only
import shared from "@hosanna/config/eslint";

export default [
  ...shared,
  {
    ignores: ["public/**", "next-env.d.ts"],
  },
];
