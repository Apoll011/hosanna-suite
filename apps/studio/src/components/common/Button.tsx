/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Loader2 } from "lucide-react";
import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline" | "link";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = React.memo(
  ({
    children,
    variant = "primary",
    size = "md",
    isLoading = false,
    icon,
    className = "",
    disabled,
    ...props
  }) => {
    const baseStyles =
      "inline-flex items-center justify-center font-semibold rounded-[var(--radius-md)] transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-m3-primary";

    const variantStyles = {
      primary:
        "bg-m3-primary hover:bg-m3-primary-dark text-white shadow-[var(--shadow-sm)] data-[action=primary]:bg-m3-primary",
      secondary:
        "bg-m3-sidebar hover:bg-m3-hover text-m3-text border border-m3-border/60",
      danger:
        "bg-m3-danger hover:opacity-90 text-white shadow-[var(--shadow-sm)]",
      ghost: "hover:bg-m3-hover text-m3-secondary hover:text-m3-text",
      outline:
        "border border-m3-border text-m3-text hover:bg-m3-hover bg-transparent",
      link: "text-m3-primary hover:text-m3-primary-dark underline-offset-2 hover:underline px-0 py-0 h-auto",
    };

    const sizeStyles = {
      sm: "min-h-8 px-2.5 py-1.5 text-xs gap-1.5",
      md: "min-h-10 px-3.5 py-2 text-sm gap-2",
      lg: "min-h-11 px-5 py-2.5 text-base gap-2.5",
      icon: "min-h-10 min-w-10 p-2",
    };

    return (
      <button
        data-action={variant === "primary" ? "primary" : undefined}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2
            className="w-4 h-4 animate-spin text-current"
            aria-hidden="true"
          />
        ) : icon ? (
          <span className="shrink-0" aria-hidden="true">
            {icon}
          </span>
        ) : null}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";
