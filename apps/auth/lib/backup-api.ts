/**
 * Hosanna API backup client for the auth app.
 *
 * Calls GET `/backup` and POST `/backup/restore` on `NEXT_PUBLIC_API_URL`
 * (must include the `/api` suffix, same as Studio's `VITE_API_URL`).
 * Uses cookie session (`credentials: "include"`) and syncs the active
 * organization on the Better Auth session before each call.
 */

import { apiBaseUrl, apiFetch, ensureActiveOrganizationSession, readApiError } from "@/lib/hosanna-api";

export type BackupDocument = Record<string, unknown> & {
  songs?: unknown[];
  folders?: unknown[];
  services?: unknown[];
};

type OrgScoped = { organizationId: string };

export const backupApi = {
  baseUrl: apiBaseUrl,

  downloadBackup: async ({ organizationId }: OrgScoped): Promise<void> => {
    await ensureActiveOrganizationSession(organizationId);
    const res = await fetch(`${apiBaseUrl()}/backup`, {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(await readApiError(res));
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
    await ensureActiveOrganizationSession(organizationId);
    const data = await apiFetch<{
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
