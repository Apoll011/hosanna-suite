import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-m3-primary focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-m3-primary text-white shadow-sm hover:bg-m3-primary/80",
        secondary: "border-transparent bg-m3-sidebar text-m3-text hover:bg-m3-sidebar/80",
        destructive: "border-transparent bg-m3-danger text-white shadow-sm hover:bg-m3-danger/80",
        outline: "text-m3-text",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
