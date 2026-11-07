/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Badge,
  Button,
  EmptyState,
  PageHeader,
  Spinner,
} from "@/src/components/common";
import { useAuth } from "@/src/contexts/AuthContext";
import { useAppNavigate } from "@/src/hooks/useAppNavigate";
import { useI18n } from "@/src/lib/i18n";
import { useAnyRole } from "@/src/lib/permissions/client";
import {
  Calendar,
  CalendarClock,
  FileMusic,
  Folder as FolderIcon,
  RotateCcw,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import React from "react";
import { useTrash } from "../hooks/useTrash";

const TYPE_ICONS: Record<string, React.ReactNode> = {
  folder: <FolderIcon className="w-4 h-4 text-amber-500" />,
  song: <FileMusic className="w-4 h-4 text-m3-primary" />,
  service: <Calendar className="w-4 h-4 text-emerald-500" />,
  agenda: <CalendarClock className="w-4 h-4 text-violet-500" />,
};

function formatDate(iso: string | null, locale: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export const TrashPage: React.FC = () => {
  const { items, isLoading, restoreItem, isRestoring } = useTrash();
  const { t, locale } = useI18n();
  const { organization } = useAuth();
  const { navigate } = useAppNavigate();
  const slugPrefix = organization?.slug ? `/${organization.slug}` : "";
  const { matched: canManageTrash, loading: roleLoading } = useAnyRole(
    "owner",
    "admin",
  );

  const typeLabel = (type: string): string =>
    type === "folder"
      ? t("common.folder")
      : type === "song"
        ? t("common.song")
        : type === "service"
          ? t("common.service")
          : t("common.agenda");

  if (roleLoading || isLoading) {
    return (
      <div className="h-full flex items-center justify-center p-12">
        <Spinner label={t("trashPage.loading")} />
      </div>
    );
  }

  if (!canManageTrash) {
    return (
      <div className="flex-1 flex flex-col w-full mx-auto p-4 sm:p-8 max-w-7xl">
        <EmptyState
          icon={
            <ShieldAlert className="w-12 h-12 text-m3-primary opacity-40" />
          }
          title={t("routes.unauthorized.title")}
          description={t("routes.unauthorized.desc")}
          actionLabel={t("routes.unauthorized.goHomeBtn")}
          onAction={() => navigate(`${slugPrefix}/folders`)}
        />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col w-full mx-auto p-4 sm:p-8 max-w-7xl">
        <PageHeader title={t("common.trash")} />
        <EmptyState
          icon={<Trash2 className="w-12 h-12 text-m3-primary opacity-40" />}
          title={t("trashPage.emptyTitle")}
          description={t("trashPage.emptyDesc")}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <PageHeader
        title={t("common.trash")}
        description={t("trashPage.emptyDesc")}
      />
      <div className="overflow-x-auto border border-m3-border/40 rounded-[var(--radius-xl)] bg-m3-card shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-m3-sidebar/40 border-b border-m3-border">
              <th className="text-label py-4 px-6">{t("common.name")}</th>
              <th className="text-label py-4 px-6">{t("common.type")}</th>
              <th className="text-label py-4 px-6">
                {t("trashPage.deletedAt")}
              </th>
              <th className="text-label py-4 px-6">
                {t("trashPage.permanentDeletion")}
              </th>
              <th className="text-label py-4 px-6 text-right">
                {t("common.action")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-m3-border/30 text-sm font-semibold">
            {items.map((item) => (
              <tr
                key={`${item.type}-${item.id}`}
                className="hover:bg-m3-hover/50 transition-colors"
              >
                <td className="py-3 px-6 flex items-center gap-2.5">
                  {TYPE_ICONS[item.type]}
                  <span className="truncate">{item.name}</span>
                </td>
                <td className="py-3 px-6">
                  <Badge variant="slate">{typeLabel(item.type)}</Badge>
                </td>
                <td className="py-3 px-6 text-m3-secondary font-medium">
                  {formatDate(item.updatedAt, locale)}
                </td>
                <td className="py-3 px-6 text-m3-danger font-medium">
                  {formatDate(item.purgeAt, locale)}
                </td>
                <td className="py-3 px-6 text-right">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={isRestoring}
                    icon={<RotateCcw className="w-3.5 h-3.5" />}
                    onClick={() => restoreItem(item)}
                  >
                    {t("trashPage.restore")}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
