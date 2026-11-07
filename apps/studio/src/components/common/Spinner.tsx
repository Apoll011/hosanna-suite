/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Loader2 } from "lucide-react";
import React from "react";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
}

export const Spinner: React.FC<SpinnerProps> = React.memo(
  ({ size = "md", label }) => {
    const sizeMap = {
      sm: "w-4 h-4",
      md: "w-8 h-8",
      lg: "w-12 h-12",
    };

    return (
      <div
        className="flex flex-col items-center justify-center gap-3 p-6 text-m3-secondary"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <Loader2
          className={`${sizeMap[size]} animate-spin text-m3-primary`}
          aria-hidden="true"
        />
        <p className={label ? "text-caption" : "sr-only"}>
          {label || "Loading…"}
        </p>
      </div>
    );
  },
);
Spinner.displayName = "Spinner";
