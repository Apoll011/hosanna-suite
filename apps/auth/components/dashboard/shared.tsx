"use client";

import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { homeSettings } from "@/lib/dashboard/settings";
import { apiFetch } from "@/lib/services/api";
import { useI18n } from "@/lib/ui/i18n";
import { loadSuiteApps, localizeSuiteApps } from "@hosanna/ui";
import { AlertCircle, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";

export type WidgetPreviewData = {
  orgData: Record<string, unknown>;
  apps: AppItem[];
  favorites: string[];
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    emailVerified: boolean;
    twoFactorEnabled: boolean;
  };
  sessionCount: number;
  organization: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    members: Array<{
      id: string;
      userId: string;
      role: string;
      user?: { name?: string | null; email?: string | null; image?: string | null };
    }>;
  };
  activeRole: string;
  subscription: {
    entitled: boolean;
    subscription: {
      id: string;
      plan: string;
      status: string;
      periodEnd: string;
      cancelAtPeriodEnd: boolean;
      trialEnd: string | null;
      billingInterval: string;
    };
  };
  teams: Array<{
    id: string;
    name: string;
    memberCount: number;
    members: Array<{
      id: string;
      userId: string;
      name: string | null;
      email: string | null;
      image: string | null;
    }>;
  }>;
  invitations: Array<{
    id: string;
    email: string;
    role: string | null;
    status: string;
  }>;
  inbox: {
    unreadCount: number;
    items: Array<{
      id: string;
      title: string;
      body: string | null;
      href: string | null;
      readAt: string | null;
      createdAt: string;
    }>;
  };
};

export const WidgetPreviewContext = createContext<WidgetPreviewData | null>(null);

export function useWidgetPreview(): WidgetPreviewData | null {
  return useContext(WidgetPreviewContext);
}

export type AppItem = {
  id: string;
  name: string;
  shortName: string;
  description?: string;
  homeUrl: string | null;
  status: string;
  accessible?: boolean;
  logoUrl?: string | null;
  accent?: string;
  categories?: string[];
};

const cache = new Map<string, { at: number; value: unknown }>();
let lastOrganizationId: string | null = null;

export function resetCacheIfOrgChanged(orgId: string) {
  if (lastOrganizationId !== orgId) {
    cache.clear();
    lastOrganizationId = orgId;
  }
}

export function getOrgCache<T>(orgId: string, key: string): T | undefined {
  resetCacheIfOrgChanged(orgId);
  const entry = cache.get(`${orgId}:${key}`);
  if (entry && Date.now() - entry.at < 60_000) {
    return entry.value as T;
  }
  return undefined;
}

export function setOrgCache<T>(orgId: string, key: string, value: T) {
  resetCacheIfOrgChanged(orgId);
  cache.set(`${orgId}:${key}`, { at: Date.now(), value });
}

export function invalidateOrgCache(orgId: string, key: string) {
  cache.delete(`${orgId}:${key}`);
}

export function useOrganizationLoader<T>(
  key: string,
  loader: (orgId: string) => Promise<T>,
  enabled = true,
) {
  const { organization } = useActiveOrganization();
  const orgId = organization?.id ?? null;
  const [state, setState] = useState<{
    organizationId: string | null;
    value: T | null;
    error: boolean;
    loading: boolean;
  }>({ organizationId: null, value: null, error: false, loading: enabled });

  useEffect(() => {
    let active = true;
    if (!orgId || !enabled) {
      setState({ organizationId: orgId, value: null, error: false, loading: false });
      return;
    }
    const cached = getOrgCache<T>(orgId, key);
    if (cached !== undefined) {
      setState({ organizationId: orgId, value: cached, error: false, loading: false });
      return;
    }
    setState({ organizationId: orgId, value: null, loading: true, error: false });
    void loader(orgId)
      .then((value) => {
        setOrgCache(orgId, key, value);
        if (active) setState({ organizationId: orgId, value, error: false, loading: false });
      })
      .catch(() => {
        if (active) setState({ organizationId: orgId, value: null, error: true, loading: false });
      });
    return () => {
      active = false;
    };
  }, [orgId, key, loader, enabled]);

  return state.organizationId === orgId
    ? state
    : { organizationId: orgId, value: null, error: false, loading: enabled };
}

export function useOrganizationData<T>(key: string, path: string, enabled = true) {
  const preview = useWidgetPreview();
  const loader = useCallback(
    (orgId: string) => apiFetch<T>(path, { organizationId: orgId }),
    [path],
  );
  const live = useOrganizationLoader<T>(key, loader, enabled && !preview);
  if (preview) {
    const matched =
      key in preview.orgData
        ? preview.orgData[key]
        : key.startsWith("service-detail-")
          ? preview.orgData["service-detail"]
          : null;
    return {
      organizationId: "preview",
      value: (matched ?? null) as T | null,
      loading: false,
      error: false,
    };
  }
  return live;
}

export function useApps() {
  const preview = useWidgetPreview();
  const { organization } = useActiveOrganization();
  const { t } = useI18n();
  const translate = useCallback((key: string) => t(key as Parameters<typeof t>[0]), [t]);
  const [apps, setApps] = useState<AppItem[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (preview) return;
    let active = true;
    const url = "/api/suite/apps?organizationId=" + encodeURIComponent(organization?.id ?? "");
    void loadSuiteApps(url)
      .then((data) => {
        if (active) {
          setApps(localizeSuiteApps(data, translate));
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [translate, organization?.id, preview]);
  if (preview) {
    return { apps: preview.apps, loading: false };
  }
  return { apps, loading };
}

export function useMusicHomeUrl(): string | null {
  const { apps } = useApps();
  return apps.find((app) => app.id === "music")?.homeUrl ?? null;
}

export function useHomeSettings() {
  const preview = useWidgetPreview();
  const live = useSyncExternalStore(homeSettings.subscribe, homeSettings.get, homeSettings.get);
  if (preview) {
    return { ...live, favorites: preview.favorites };
  }
  return live;
}

export function isOpenableApp(app: AppItem): boolean {
  return app.status !== "coming_soon" && app.accessible !== false && Boolean(app.homeUrl);
}

export function toggleFavoriteApp(favorites: readonly string[], appId: string) {
  const exists = favorites.includes(appId);
  homeSettings.set({
    favorites: exists ? favorites.filter((id) => id !== appId) : [...favorites, appId],
  });
}

export function WidgetHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-2">
      <h2 className="text-title truncate">{title}</h2>
      {action}
    </div>
  );
}

export function WidgetHeaderLink({ href, label }: { href: string; label: string }) {
  const isInternal = href.startsWith("/") && !href.startsWith("//");
  const className =
    "inline-flex shrink-0 items-center gap-1 text-xs font-medium text-m3-primary hover:underline";
  if (isInternal) {
    return (
      <Link href={href} className={className}>
        {label}
        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
      </Link>
    );
  }
  return (
    <a href={href} className={className}>
      {label}
      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
    </a>
  );
}

export function WidgetErrorBox({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-center gap-2 rounded-md border border-m3-danger/25 bg-m3-danger/5 px-3 py-2.5 text-sm text-m3-danger"
    >
      <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
      <span>{message}</span>
    </div>
  );
}

export function WidgetEmptyBox({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-m3-border bg-m3-sidebar/40 px-3 py-4 text-center">
      <div className="mb-2.5 rounded-md bg-m3-hover p-2 text-m3-secondary" aria-hidden>
        {icon}
      </div>
      <p className="text-sm font-medium text-m3-text">{title}</p>
      {description ? <p className="mt-1 max-w-xs text-caption">{description}</p> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}

export function SkeletonLine({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-m3-border/45 ${className}`} />;
}

export type WidgetDensity = "compact" | "standard" | "expanded";

export function getWidgetDensity(instance: { w: number; h: number }): WidgetDensity {
  if (instance.h <= 1 || (instance.w <= 2 && instance.h <= 1)) return "compact";
  if (instance.w >= 6 || instance.h >= 4) return "expanded";
  return "standard";
}

export function getListRowLimit(
  h: number,
  rowSize: "compact" | "normal" | "tall" = "normal",
): number {
  if (h <= 1) return rowSize === "compact" ? 2 : 1;
  const rowPx = rowSize === "compact" ? 38 : rowSize === "tall" ? 64 : 50;
  return Math.max(2, Math.floor((h * 108 - 76) / rowPx));
}

export function todayYmdLocal(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function diffDaysFromToday(ymd: string): number {
  const [y, m, d] = ymd.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return 0;
  const target = new Date(y, m - 1, d);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export function daysBetweenYmd(from: string, to: string): number {
  const [fy, fm, fd] = from.slice(0, 10).split("-").map(Number);
  const [ty, tm, td] = to.slice(0, 10).split("-").map(Number);
  if (!fy || !fm || !fd || !ty || !tm || !td) return 0;
  const a = Date.UTC(fy, fm - 1, fd);
  const b = Date.UTC(ty, tm - 1, td);
  return Math.round((b - a) / 86_400_000);
}

export function formatServiceDate(ymd: string, locale: string): string {
  const [y, m, d] = ymd.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return ymd;
  return new Date(y, m - 1, d).toLocaleDateString(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export type SongRow = {
  id: string;
  title?: string | null;
  artist?: string | null;
  tags?: string[] | null;
  content?: string | null;
  song_number?: number | null;
  updatedAt?: string | null;
};

export type SongsResponse = {
  total: number;
  songs?: SongRow[];
};

export type FolderRow = {
  id: string;
  name: string;
  parentId?: string | null;
  color?: string | null;
  songCount?: number;
  folderCount?: number;
};

export type HealthCriterion =
  "title" | "artist" | "key" | "tempo" | "sections" | "chords" | "songNumber" | "youtube";

export function extractSongKey(content?: string | null): string | null {
  if (!content) return null;
  const match = content.match(/\{(?:key|k)\s*:\s*([^}\r\n]+)\}/i);
  const raw = match?.[1]?.trim();
  return raw || null;
}

export function computeSongHealthInsights(songs: SongRow[]) {
  if (songs.length === 0) {
    return {
      healthPct: 100,
      healthyCount: 0,
      needsAttentionCount: 0,
      withChords: 0,
      withKey: 0,
      withTags: 0,
      topTags: [] as [string, number][],
      topKeys: [] as [string, number][],
      missingCounts: [] as Array<{ criterion: HealthCriterion; count: number }>,
    };
  }

  let scoreSum = 0;
  let healthyCount = 0;
  let withChords = 0;
  let withKey = 0;
  let withTags = 0;
  const tagCounts = new Map<string, number>();
  const keyCounts = new Map<string, number>();
  const missingMap = new Map<HealthCriterion, number>([
    ["title", 0],
    ["artist", 0],
    ["key", 0],
    ["tempo", 0],
    ["sections", 0],
    ["chords", 0],
    ["songNumber", 0],
    ["youtube", 0],
  ]);

  for (const song of songs) {
    const content = song.content ?? "";
    const hasTitle = Boolean(song.title?.trim());
    const hasArtist = Boolean(song.artist?.trim());
    const key = extractSongKey(content);
    const hasKey = Boolean(key);
    const hasTempo = /\{(?:tempo|bpm)\s*:\s*[^}\r\n]+\}/i.test(content);
    const hasSections =
      /\{(?:start_of_|soc|sov|sob|sot|comment|c)\b/i.test(content) ||
      /^\[?(?:Verse|Chorus|Bridge|Intro|Outro|Pre-Chorus|Refr[aã]o|Estrofe|Ponte)\b/im.test(
        content,
      );
    const hasChord = /\[[A-G][#b]?[^\]]*\]/.test(content);
    const hasSongNumber = typeof song.song_number === "number" && song.song_number > 0;
    const hasYoutube = /\{(?:youtube|yt|meta:\s*youtube)\s*:\s*[^}\r\n]+\}/i.test(content);

    const tags = Array.isArray(song.tags) ? song.tags : [];
    if (tags.length > 0) withTags += 1;
    if (hasChord) withChords += 1;
    if (hasKey && key) {
      withKey += 1;
      keyCounts.set(key, (keyCounts.get(key) ?? 0) + 1);
    }

    for (const tag of tags) {
      const clean = tag.trim();
      if (clean) tagCounts.set(clean, (tagCounts.get(clean) ?? 0) + 1);
    }

    const checks: Array<[HealthCriterion, boolean]> = [
      ["title", hasTitle],
      ["artist", hasArtist],
      ["key", hasKey],
      ["tempo", hasTempo],
      ["sections", hasSections],
      ["chords", hasChord],
      ["songNumber", hasSongNumber],
      ["youtube", hasYoutube],
    ];

    let passed = 0;
    for (const [criterion, ok] of checks) {
      if (ok) {
        passed += 1;
      } else {
        missingMap.set(criterion, (missingMap.get(criterion) ?? 0) + 1);
      }
    }
    if (passed === checks.length) healthyCount += 1;
    scoreSum += Math.round((passed / checks.length) * 100);
  }

  const missingCounts = [...missingMap.entries()]
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([criterion, count]) => ({ criterion, count }));

  return {
    healthPct: Math.round(scoreSum / songs.length),
    healthyCount,
    needsAttentionCount: songs.length - healthyCount,
    withChords,
    withKey,
    withTags,
    topTags: [...tagCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3),
    topKeys: [...keyCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4),
    missingCounts,
  };
}
