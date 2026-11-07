import { Badge, Button } from "@/src/components/common";
import { useI18n } from "@/src/lib/i18n";
import { Service } from "@/src/types";
import { Archive, Calendar, Church, MoreVertical } from "lucide-react";
import React from "react";

export interface ServiceGridCardProps {
  service: Service;
  isSelected: boolean;
  isArchived?: boolean;
  density?: "comfortable" | "compact";
  onClick: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

export const ServiceGridCard: React.FC<ServiceGridCardProps> = React.memo(
  ({
    service,
    isSelected,
    isArchived = false,
    density = "comfortable",
    onClick,
    onDoubleClick,
    onContextMenu,
  }) => {
    const { t, locale } = useI18n();
    const isCompact = density === "compact";

    const formatDate = (
      dateStr: string,
      options?: Intl.DateTimeFormatOptions,
    ) =>
      new Date(dateStr).toLocaleDateString(
        locale,
        options ?? {
          weekday: "long",
          day: "numeric",
          month: "long",
        },
      );

    return (
      <div
        data-item-id={service.id}
        data-item-type="service"
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onContextMenu={onContextMenu}
        className={`${isCompact ? "p-3.5 rounded-2xl" : "p-5 rounded-3xl"} border transition-all cursor-pointer flex flex-col items-center text-center group relative shadow-sm select-none ${
          isArchived ? "opacity-50" : ""
        } ${
          isSelected
            ? "bg-m3-primary/10 border-m3-primary shadow-lg shadow-m3-primary/10"
            : "border-m3-border/50 bg-m3-card hover:bg-m3-hover hover:border-m3-primary/40 hover:shadow-xl"
        } active:scale-95`}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onContextMenu(e);
          }}
          className={`absolute ${isCompact ? "top-2 right-2 p-1" : "top-3 right-3 p-1.5"} rounded-xl text-m3-secondary hover:text-m3-text hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-all z-10 cursor-pointer opacity-0 group-hover:opacity-100`}
          title={t("explorer.moreOptions")}
          aria-label={t("explorer.moreOptions")}
        >
          <MoreVertical className={isCompact ? "w-3.5 h-3.5" : "w-4.5 h-4.5"} />
        </button>

        <div
          className={`${isCompact ? "w-10 h-10 rounded-xl mb-2" : "w-14 h-14 rounded-2xl mb-3"} border flex items-center justify-center group-hover:scale-110 transition-transform ${
            isArchived
              ? "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
              : "bg-sky-500/10 border-sky-500/20 text-sky-600 dark:text-sky-400"
          }`}
        >
          {isArchived ? (
            <Archive
              className={`${isCompact ? "w-5 h-5" : "w-8 h-8"} opacity-80`}
            />
          ) : (
            <Church
              className={`${isCompact ? "w-5 h-5" : "w-8 h-8"} opacity-80`}
            />
          )}
        </div>

        <span
          className={`${isCompact ? "text-xs" : "text-sm"} font-semibold text-m3-text transition-colors truncate w-full px-1`}
        >
          {service.name}
        </span>

        <span className="text-[10px] text-m3-secondary font-bold truncate w-full px-1 mt-0.5 opacity-70">
          {formatDate(service.date, {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </span>
      </div>
    );
  },
);
ServiceGridCard.displayName = "ServiceGridCard";

export interface ServiceTableRowProps {
  service: Service;
  isSelected: boolean;
  isArchived?: boolean;
  density?: "comfortable" | "compact";
  onClick: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

export const ServiceTableRow: React.FC<ServiceTableRowProps> = React.memo(
  ({
    service,
    isSelected,
    isArchived = false,
    density = "comfortable",
    onClick,
    onDoubleClick,
    onContextMenu,
  }) => {
    const { t, locale } = useI18n();
    const isCompact = density === "compact";
    const cellPadding = isCompact ? "py-2.5 px-4" : "py-4 px-6";

    const formatDate = (
      dateStr: string,
      options?: Intl.DateTimeFormatOptions,
    ) =>
      new Date(dateStr).toLocaleDateString(
        locale,
        options ?? {
          weekday: "long",
          day: "numeric",
          month: "long",
        },
      );

    return (
      <tr
        data-item-id={service.id}
        data-item-type="service"
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onContextMenu={onContextMenu}
        className={`cursor-pointer transition-all group select-none ${
          isArchived ? "opacity-50" : ""
        } ${
          isSelected
            ? "bg-m3-primary/10 text-m3-text"
            : "hover:bg-m3-hover/50 text-m3-text"
        }`}
      >
        <td className={cellPadding}>
          <div className="flex items-center gap-4 group-hover:translate-x-1 transition-transform">
            {isArchived ? (
              <Archive
                className={`${isCompact ? "w-4 h-4" : "w-5 h-5"} text-amber-500 opacity-80`}
              />
            ) : (
              <Calendar
                className={`${isCompact ? "w-4 h-4" : "w-5 h-5"} text-sky-500 opacity-80`}
              />
            )}
            <span>{service.name}</span>
            {isArchived && (
              <Badge variant="slate">{t("explorer.archived")}</Badge>
            )}
          </div>
        </td>
        <td className={`${cellPadding} text-m3-secondary opacity-70`}>
          {t("explorer.service")}
        </td>
        <td className={`${cellPadding} text-m3-secondary`}>
          {formatDate(service.date, {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </td>
        <td className={`${cellPadding} text-right`}>
          <div className="flex items-center justify-end gap-1">
            <Button
              size={isCompact ? "sm" : "lg"}
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onDoubleClick();
              }}
            >
              {t("explorer.open")}
            </Button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onContextMenu(e);
              }}
              className="p-1.5 rounded-xl text-m3-secondary hover:text-m3-text hover:bg-m3-hover transition-colors cursor-pointer"
              title={t("explorer.moreOptions")}
              aria-label={t("explorer.moreOptions")}
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
    );
  },
);
ServiceTableRow.displayName = "ServiceTableRow";
