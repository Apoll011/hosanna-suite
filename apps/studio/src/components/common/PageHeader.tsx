/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Shared page shell for non-explorer screens (Agenda, Analytics, Settings-adjacent).
 * Title uses display type; keep one primary action in `actions`.
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  actions,
  className = "",
}) => {
  return (
    <header
      className={`flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6 mb-6 ${className}`}
    >
      <div className="min-w-0">
        <h1 className="text-display text-m3-text">{title}</h1>
        {description && (
          <p className="text-muted mt-1 max-w-2xl text-pretty">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </header>
  );
};
