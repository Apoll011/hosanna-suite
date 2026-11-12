import { authApiFetch } from "./authApi";

export const backupApi = {
  downloadBackup: async (): Promise<void> => {
    const backup = await authApiFetch<unknown>("/backup");

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
  ): Promise<{ message: string; counts: Record<string, number> }> => {
    const data = await authApiFetch<{
      message?: string;
      counts?: Record<string, number>;
    }>("/backup/restore", {
      method: "POST",
      body: JSON.stringify(backupData),
    });

    return {
      message: data?.message ?? "",
      counts: (data?.counts ?? {}) as Record<string, number>,
    };
  },
};
