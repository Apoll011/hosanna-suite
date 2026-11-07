/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

interface SurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  /** quiet = no border; inset = recessed; default = bordered card */
  variant?: "default" | "quiet" | "inset";
  padding?: "none" | "sm" | "md" | "lg";
  as?: "div" | "section" | "article";
}

const PADDING = {
  none: "",
  sm: "p-4",
  md: "p-5 sm:p-6",
  lg: "p-6 sm:p-8",
} as const;

const VARIANT = {
  default: "surface",
  quiet: "surface-quiet",
  inset: "surface-inset",
} as const;

export const Surface: React.FC<SurfaceProps> = ({
  variant = "default",
  padding = "md",
  as: Tag = "div",
  className = "",
  children,
  ...props
}) => {
  return (
    <Tag
      className={`${VARIANT[variant]} ${PADDING[padding]} ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );
};
