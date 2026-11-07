/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Button } from "./Button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-10 sm:p-12 text-center rounded-[var(--radius-lg)] border border-dashed border-m3-border bg-m3-sidebar/40 my-4 h-full min-h-[12rem]">
      {icon && (
        <div
          className="p-3 bg-m3-hover rounded-[var(--radius-md)] text-m3-secondary mb-4"
          aria-hidden="true"
        >
          {icon}
        </div>
      )}
      <h3 className="text-title text-m3-text">{title}</h3>
      <p className="text-muted max-w-sm mt-1.5 mb-6 text-pretty">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="primary">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
