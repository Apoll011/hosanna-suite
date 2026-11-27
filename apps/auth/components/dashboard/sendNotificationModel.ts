import type {
  CreateNotificationInput,
  NotificationChannel,
} from "@/lib/services/notifications-api";

export type MentionTarget =
  | { kind: "all"; id: "all"; label: string }
  | { kind: "team"; id: string; label: string; memberCount?: number }
  | {
      kind: "user";
      id: string;
      label: string;
      email?: string;
      image?: string | null;
    };

export type ComposerPart =
  { t: "text"; s: string } | { t: "chip"; id: string; target: MentionTarget };

export type OrgMemberInput = {
  userId: string;
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
};

export type OrgTeamInput = {
  id: string;
  name: string;
  memberCount?: number;
};

export function buildMentionCandidates(params: {
  allLabel: string;
  teams: readonly OrgTeamInput[];
  members: readonly OrgMemberInput[];
}): MentionTarget[] {
  const result: MentionTarget[] = [{ kind: "all", id: "all", label: params.allLabel }];

  for (const team of params.teams) {
    if (!team.id || !team.name) continue;
    result.push({
      kind: "team",
      id: team.id,
      label: team.name,
      memberCount: team.memberCount,
    });
  }

  const seenUsers = new Set<string>();
  for (const member of params.members) {
    if (!member.userId || seenUsers.has(member.userId)) continue;
    seenUsers.add(member.userId);
    const label = member.user?.name?.trim() || member.user?.email?.trim() || member.userId;
    result.push({
      kind: "user",
      id: member.userId,
      label,
      email: member.user?.email ?? undefined,
      image: member.user?.image ?? null,
    });
  }

  return result;
}

export function filterMentionCandidates(
  candidates: readonly MentionTarget[],
  query: string,
): MentionTarget[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...candidates];

  return candidates.filter((item) => {
    if (item.kind === "all") {
      return (
        item.label.toLowerCase().startsWith(q) ||
        "all".startsWith(q) ||
        "everyone".startsWith(q) ||
        "todos".startsWith(q)
      );
    }
    if (item.kind === "team") {
      return (
        item.label.toLowerCase().includes(q) ||
        item.label
          .toLowerCase()
          .split(/\s+/)
          .some((word) => word.startsWith(q))
      );
    }
    const nameMatch = item.label
      .toLowerCase()
      .split(/\s+/)
      .some((word) => word.startsWith(q));
    const emailMatch = item.email ? item.email.toLowerCase().startsWith(q) : false;
    return nameMatch || emailMatch || item.label.toLowerCase().includes(q);
  });
}

export function chipDisplayText(target: MentionTarget): string {
  if (target.kind === "all") return `@${target.label}`;
  if (target.kind === "team") return `@${target.label}`;
  const first = target.label.split(/\s+/)[0] || target.label;
  return `@${first}`;
}

export function serializeComposerMessage(parts: readonly ComposerPart[]): {
  text: string;
  targets: MentionTarget[];
} {
  const raw = parts.map((part) => (part.t === "text" ? part.s : part.target.label)).join("");
  const text = raw.replace(/\s+/g, " ").trim();

  const chips = parts
    .filter((part): part is Extract<ComposerPart, { t: "chip" }> => part.t === "chip")
    .map((part) => part.target);

  const hasAll = chips.some((target) => target.kind === "all");
  if (hasAll) {
    const allTarget = chips.find((target) => target.kind === "all")!;
    return { text, targets: [allTarget] };
  }

  const unique: MentionTarget[] = [];
  const seen = new Set<string>();
  for (const target of chips) {
    const key = `${target.kind}:${target.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(target);
  }

  return { text, targets: unique };
}

export function buildNotificationPayloads(params: {
  organizationId: string;
  text: string;
  targets: readonly MentionTarget[];
  channels: readonly NotificationChannel[];
  type?: string;
}): CreateNotificationInput[] {
  const trimmed = params.text.trim();
  if (!trimmed || params.targets.length === 0 || params.channels.length === 0) {
    return [];
  }

  const [firstLine = trimmed, ...rest] = trimmed.split("\n");
  const title = firstLine.length > 255 ? `${firstLine.slice(0, 252)}…` : firstLine;
  const body = rest.join("\n").trim() || undefined;

  return params.targets.map((target) => {
    const base: CreateNotificationInput = {
      type: params.type ?? "info",
      title,
      channels: [...params.channels],
      ...(body ? { body } : {}),
    };
    if (target.kind === "all") {
      base.organizationId = params.organizationId;
    } else if (target.kind === "team") {
      base.teamId = target.id;
    } else {
      base.userId = target.id;
    }
    return base;
  });
}
