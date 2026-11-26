// SPDX-License-Identifier: AGPL-3.0-only
import { cva } from "class-variance-authority";

import { cn } from "../../lib/cn";

import type { TEventColor } from "../../types";

const eventBulletVariants = cva("size-2 rounded-full", {
  variants: {
    color: {
      blue: "bg-m3-primary",
      green: "bg-green-600 dark:bg-green-500",
      red: "bg-red-600 dark:bg-red-500",
      yellow: "bg-yellow-600 dark:bg-yellow-500",
      purple: "bg-purple-600 dark:bg-purple-500",
      gray: "bg-m3-secondary",
      orange: "bg-orange-600 dark:bg-orange-500",
    },
  },
  defaultVariants: {
    color: "blue",
  },
});

export function EventBullet({ color, className }: { color: TEventColor; className: string }) {
  return <div className={cn(eventBulletVariants({ color, className }))} />;
}
