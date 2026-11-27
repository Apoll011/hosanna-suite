/**
 * @license
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ChevronLeft, ChevronRight } from "lucide-react";
import { SpringDropdown, type SpringDropdownOption } from "@hosanna/ui";
import React, { useMemo } from "react";
import { useI18n } from "@/src/lib/i18n";

const DEFAULT_PAGE_SIZE_OPTIONS = [25, 50, 100] as const;

export interface TablePaginationProps {
  page: number;
  totalItems: number;
  /** Page size; `0` means show all items. */
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  /** Plural item noun shown after the total, e.g. "songs". */
  itemLabel: string;
  /** Label when there are zero items. */
  emptyLabel: string;
  pageSizeOptions?: readonly number[];
  className?: string;
}

function getVisiblePages(page: number, totalPages: number): number[] {
  return Array.from({ length: totalPages }, (_, i) => i + 1).filter((p) => {
    if (totalPages <= 7) return true;
    if (p === 1 || p === totalPages) return true;
    return Math.abs(p - page) <= 1;
  });
}

export const TablePagination: React.FC<TablePaginationProps> = ({
  page,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  itemLabel,
  emptyLabel,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  className = "",
}) => {
  const { t } = useI18n();

  const effectivePerPage = itemsPerPage === 0 ? Math.max(1, totalItems) : itemsPerPage;
  const totalPages = Math.max(1, Math.ceil(totalItems / effectivePerPage) || 1);

  const from = totalItems === 0 ? 0 : itemsPerPage === 0 ? 1 : (page - 1) * effectivePerPage + 1;
  const to =
    totalItems === 0
      ? 0
      : itemsPerPage === 0
        ? totalItems
        : Math.min(page * effectivePerPage, totalItems);

  const visiblePages = useMemo(() => getVisiblePages(page, totalPages), [page, totalPages]);
  const pageSizeDropdownOptions = useMemo<SpringDropdownOption<string>[]>(
    () => [
      ...pageSizeOptions.map((size) => ({ id: String(size), label: String(size) })),
      { id: "0", label: t("table.all", { count: totalItems }) },
    ],
    [pageSizeOptions, t, totalItems],
  );

  return (
    <div
      className={`px-4 py-3 bg-m3-sidebar/30 border-t border-m3-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs ${className}`}
    >
      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
        <span className="text-m3-secondary font-medium">
          {totalItems === 0 ? (
            emptyLabel
          ) : (
            <>
              {t("table.showing")} <strong className="font-bold text-m3-text">{from}</strong>{" "}
              {t("table.to")} <strong className="font-bold text-m3-text">{to}</strong>{" "}
              {t("table.of")} <strong className="font-bold text-m3-text">{totalItems}</strong>{" "}
              {itemLabel}
            </>
          )}
        </span>

        <SpringDropdown
            mode="single"
            options={pageSizeDropdownOptions}
            selected={String(itemsPerPage)}
            onChange={(size) => onItemsPerPageChange(Number(size))}
            ariaLabel={t("table.display")}
            startAdornment={<span>{t("table.display")}</span>}
            className="font-bold"
          />
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-1 bg-m3-card border border-m3-border rounded-xl p-1 shadow-sm">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="p-1.5 rounded-lg text-m3-secondary hover:text-m3-text hover:bg-m3-hover disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            title={t("table.prevPage")}
            aria-label={t("table.prevPage")}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {visiblePages.map((p, idx) => {
            const prev = visiblePages[idx - 1];
            const showEllipsis = prev !== undefined && p - prev > 1;
            return (
              <React.Fragment key={p}>
                {showEllipsis && <span className="px-1 text-m3-secondary opacity-50">…</span>}
                <button
                  type="button"
                  onClick={() => onPageChange(p)}
                  aria-current={page === p ? "page" : undefined}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    page === p
                      ? "bg-m3-primary text-white shadow-sm"
                      : "hover:bg-m3-hover text-m3-text"
                  }`}
                >
                  {p}
                </button>
              </React.Fragment>
            );
          })}

          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="p-1.5 rounded-lg text-m3-secondary hover:text-m3-text hover:bg-m3-hover disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            title={t("table.nextPage")}
            aria-label={t("table.nextPage")}
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
