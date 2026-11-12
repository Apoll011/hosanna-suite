/**
 * Same-origin backup client (auth-app hosted).
 */

import {
  ensureActiveOrganizationSession,
  localApiFetch,
  readLocalApiError,
} from "@/lib/services/local-api";

export type BackupDocument = Record<string, unknown> & {
  songs?: unknown[];
  folders?: unknown[];
  services?: unknown[];
};

type OrgScoped = { organizationId: string };

export const backupApi = {
  downloadBackup: async ({ organizationId }: OrgScoped): Promise<void> => {
    await ensureActiveOrganizationSession(organizationId);
    const res = await fetch(`/api/backup`, {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(await readLocalApiError(res));
    const backup = await res.json();

    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hosanna_backup_${new Date().toISOString().split("T")[0]}.hosanna`;
    a.click();
    URL.revokeObjectURL(url);
  },

  restoreBackup: async (
    backupData: unknown,
    { organizationId }: OrgScoped,
  ): Promise<{ message: string; counts: Record<string, number> }> => {
    const data = await localApiFetch<{
      message?: string;
      counts?: Record<string, number>;
    }>("/backup/restore", {
      method: "POST",
      body: JSON.stringify(backupData),
      organizationId,
    });
    return {
      message: data?.message ?? "",
      counts: (data?.counts ?? {}) as Record<string, number>,
    };
  },
};
