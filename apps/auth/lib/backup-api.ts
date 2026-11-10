/**
 * Hosanna API backup client for the auth app.
 *
 * Calls GET `/backup` and POST `/backup/restore` on `NEXT_PUBLIC_API_URL`
 * (must include the `/api` suffix, same as Studio's `VITE_API_URL`).
 * Uses cookie session (`credentials: "include"`) — cross-subdomain cookies
 * (`hosanna.live`) + API CORS already allow `auth.hosanna.live`.
 */

function apiBaseUrl(): string {
  const fromEnv =
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL) || undefined;
  if (fromEnv) return fromEnv.replace(/\/+$/, "");
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return "http://localhost:3000/api";
    }
    if (host.endsWith(".hosanna.live") || host === "hosanna.live") {
      const prefix = host.startsWith("dev-") || host.includes("dev-") ? "dev-" : "";
      return `https://${prefix}api.hosanna.live/api`;
    }
  }
  return "https://api.hosanna.live/api";
}

async function readError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as {
      error?: { message?: string } | string;
      message?: string;
    };
    if (body?.error) {
      if (typeof body.error === "string") return body.error;
      if (body.error.message) return body.error.message;
    }
    if (typeof body?.message === "string") return body.message;
  } catch {
    /* ignore */
  }
  return `Request failed (${res.status})`;
}

export type BackupDocument = Record<string, unknown> & {
  songs?: unknown[];
  folders?: unknown[];
  services?: unknown[];
};

export const backupApi = {
  baseUrl: apiBaseUrl,

  downloadBackup: async (): Promise<void> => {
    const res = await fetch(`${apiBaseUrl()}/backup`, {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(await readError(res));
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
  ): Promise<{ message: string; counts: Record<string, number> }> => {
    const res = await fetch(`${apiBaseUrl()}/backup/restore`, {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(backupData),
    });
    if (!res.ok) throw new Error(await readError(res));
    const data = (await res.json()) as {
      message?: string;
      counts?: Record<string, number>;
    };
    return {
      message: data?.message ?? "",
      counts: (data?.counts ?? {}) as Record<string, number>,
    };
  },
};
