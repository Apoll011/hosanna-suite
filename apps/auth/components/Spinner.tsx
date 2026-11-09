"use client";

import { Loader2 } from "lucide-react";

export function Spinner({
  size = "md",
  label,
}: {
  size?: "sm" | "md" | "lg";
  label?: string;
}) {
  const sizeClass = size === "sm" ? "w-4 h-4" : size === "lg" ? "w-8 h-8" : "w-6 h-6";
  return (
    <div className="inline-flex flex-col items-center gap-2">
      <Loader2 className={`${sizeClass} animate-spin text-m3-primary`} aria-hidden />
      {label ? <span className="text-xs text-m3-secondary">{label}</span> : null}
    </div>
  );
}
