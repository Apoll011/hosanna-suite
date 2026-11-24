"use client";

import { AccountCenter } from "@/components/account/AccountCenter";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { authClient } from "@/lib/auth/client";
import {
  readCachedTeams,
  writeCachedTeams,
  type TeamCacheItem,
} from "@/lib/organization/teams-cache";
import { useI18n } from "@/lib/ui/i18n";
import { canManageTeam } from "@hosanna/auth";
import { Button, ConfirmDialog, Input, PageHeader, Spinner, Surface, useCan } from "@hosanna/ui";
import { Check, Crown, Plus, Search, Shield, UserMinus, UserPlus, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

type OrgMember = NonNullable<
  ReturnType<typeof useActiveOrganization>["organization"]
>["members"] extends (infer M)[]
  ? M
  : never;

export function OrgTeamsPage() {
  const { t, locale } = useI18n();
  const { user, organization, isLoading: orgLoading } = useActiveOrganization();
  const { granted: canCreate } = useCan("team.create");
  const { granted: canUpdate } = useCan("team.update");
  const { granted: canDelete } = useCan("team.delete");
  const [teams, setTeams] = useState<TeamCacheItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [renameDraft, setRenameDraft] = useState("");
  const [addUserId, setAddUserId] = useState("");
  const [confirm, setConfirm] = useState<
    | { kind: "team"; team: TeamCacheItem }
    | { kind: "member"; team: TeamCacheItem; userId: string }
    | null
  >(null);
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);

  const selected = teams.find((team) => team.id === selectedId) ?? null;
  const role = organization?.members?.find((member) => member.userId === user?.id)?.role ?? null;

  const loadTeams = useCallback(async (orgId: string) => {
    const response = await fetch("/api/organization/teams", { cache: "no-store" });
    const payload: unknown = await response.json();
    if (
      !response.ok ||
      !payload ||
      typeof payload !== "object" ||
      !("teams" in payload) ||
      !Array.isArray(payload.teams)
    ) {
      throw new Error("teams could not be loaded");
    }
    const next: TeamCacheItem[] = payload.teams.flatMap((value): TeamCacheItem[] => {
      if (
        !value ||
        typeof value !== "object" ||
        !("id" in value) ||
        typeof value.id !== "string" ||
        !("name" in value) ||
        typeof value.name !== "string"
      )
        return [];
      const members =
        "members" in value && Array.isArray(value.members)
          ? value.members.flatMap((item) =>
              item &&
              typeof item === "object" &&
              "id" in item &&
              typeof item.id === "string" &&
              "userId" in item &&
              typeof item.userId === "string"
                ? [
                    {
                      id: item.id,
                      userId: item.userId,
                      name: "name" in item && typeof item.name === "string" ? item.name : null,
                      email: "email" in item && typeof item.email === "string" ? item.email : null,
                      image: "image" in item && typeof item.image === "string" ? item.image : null,
                    },
                  ]
                : [],
            )
          : [];
      return [
        {
          id: value.id,
          name: value.name,
          members,
          memberCount: members.length,
          createdAt:
            "createdAt" in value && typeof value.createdAt === "string"
              ? value.createdAt
              : new Date().toISOString(),
        },
      ];
    });
    writeCachedTeams(orgId, next);
    setTeams(next);
    setSelectedId((current) =>
      current && next.some((team) => team.id === current) ? current : (next[0]?.id ?? null),
    );
    setError(null);
  }, []);

  useEffect(() => {
    const orgId = organization?.id;
    if (!orgId) return;
    const cached = readCachedTeams(orgId);
    if (cached) {
      setTeams(cached);
      setSelectedId((current) => current ?? cached[0]?.id ?? null);
      setLoading(false);
    }
    void loadTeams(orgId)
      .catch(() => {
        if (!cached) setError(t("teams.loadError"));
      })
      .finally(() => setLoading(false));
  }, [organization?.id, loadTeams, t]);

  useEffect(() => {
    if (!organization?.id) return;
    void authClient
      .getSession()
      .then(({ data }: { data?: { session?: { activeTeamId?: string | null } } | null }) => {
        setActiveTeamId(data?.session?.activeTeamId ?? null);
      });
  }, [organization?.id]);

  const filteredTeams = useMemo(() => {
    const query = search.trim().toLocaleLowerCase(locale);
    return teams.filter((team) => team.name.toLocaleLowerCase(locale).includes(query));
  }, [teams, search, locale]);

  const canManage = (team: TeamCacheItem, action: "update" | "delete") =>
    canManageTeam({
      role,
      action,
      isTeamMember: team.members.some((member) => member.userId === user?.id),
    }) && (action === "update" ? canUpdate : canDelete);

  const refresh = async () => {
    if (organization?.id) await loadTeams(organization.id);
  };

  const mutate = async (path: string, method: string, body?: unknown) => {
    const response = await fetch(path, {
      method,
      headers: body ? { "content-type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const payload: unknown = await response.json();
    if (!response.ok) {
      const message =
        payload &&
        typeof payload === "object" &&
        "error" in payload &&
        typeof payload.error === "string"
          ? payload.error
          : t("teams.actionError");
      throw new Error(message);
    }
  };

  const createTeam = async (event: FormEvent) => {
    event.preventDefault();
    if (!organization?.id || !nameDraft.trim()) return;
    setSaving(true);
    try {
      await mutate("/api/organization/teams", "POST", { name: nameDraft.trim() });
      setNameDraft("");
      setCreateOpen(false);
      await refresh();
      setToast({ msg: t("teams.created"), type: "success" });
    } catch (cause) {
      setToast({
        msg: cause instanceof Error ? cause.message : t("teams.actionError"),
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const renameTeam = async (event: FormEvent) => {
    event.preventDefault();
    if (!selected) return;
    setSaving(true);
    try {
      await mutate(`/api/organization/teams/${encodeURIComponent(selected.id)}`, "PATCH", {
        name: renameDraft.trim(),
      });
      await refresh();
      setToast({ msg: t("teams.renamed"), type: "success" });
    } catch (cause) {
      setToast({
        msg: cause instanceof Error ? cause.message : t("teams.actionError"),
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const confirmAction = async () => {
    if (!confirm) return;
    const pending = confirm;
    setSaving(true);
    try {
      if (pending.kind === "team") {
        await mutate(`/api/organization/teams/${encodeURIComponent(pending.team.id)}`, "DELETE");
        if (activeTeamId === pending.team.id) setActiveTeamId(null);
        setSelectedId(null);
      } else {
        await mutate(
          `/api/organization/teams/${encodeURIComponent(pending.team.id)}/members`,
          "DELETE",
          { userId: pending.userId },
        );
      }
      await refresh();
      setToast({
        msg: pending.kind === "team" ? t("teams.deleted") : t("teams.memberRemoved"),
        type: "success",
      });
      setConfirm(null);
    } catch (cause) {
      setToast({
        msg: cause instanceof Error ? cause.message : t("teams.actionError"),
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const addMember = async (event: FormEvent) => {
    event.preventDefault();
    if (!selected || !addUserId) return;
    setSaving(true);
    try {
      await mutate(`/api/organization/teams/${encodeURIComponent(selected.id)}/members`, "POST", {
        userId: addUserId,
      });
      setAddUserId("");
      await refresh();
      setToast({ msg: t("teams.memberAdded"), type: "success" });
    } catch (cause) {
      setToast({
        msg: cause instanceof Error ? cause.message : t("teams.actionError"),
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const setActive = async (team: TeamCacheItem) => {
    setSaving(true);
    try {
      const { error: activeError } = await authClient.organization.setActiveTeam({
        teamId: team.id,
      });
      if (activeError) throw new Error(activeError.message ?? t("teams.actionError"));
      setActiveTeamId(team.id);
      setToast({ msg: t("teams.activeUpdated"), type: "success" });
    } catch (cause) {
      setToast({
        msg: cause instanceof Error ? cause.message : t("teams.actionError"),
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const candidateMembers: OrgMember[] = organization?.members ?? [];
  const addableMembers = candidateMembers.filter(
    (member) =>
      member.userId && !selected?.members.some((teamMember) => teamMember.userId === member.userId),
  );

  if (orgLoading || (loading && !teams.length)) {
    return (
      <AccountCenter>
        <div className="flex justify-center py-16">
          <Spinner size="md" label={t("common.loading")} />
        </div>
      </AccountCenter>
    );
  }

  return (
    <AccountCenter toast={toast}>
      <div className="space-y-5">
        <PageHeader
          title={t("teams.title")}
          description={t("teams.description", { organization: organization?.name ?? "" })}
          actions={
            canCreate ? (
              <Button
                variant="primary"
                size="sm"
                icon={<Plus className="h-4 w-4" />}
                onClick={() => setCreateOpen(true)}
              >
                {t("teams.create")}
              </Button>
            ) : undefined
          }
        />
        {error ? (
          <Surface>
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-m3-danger">{error}</p>
              <Button variant="outline" size="sm" onClick={() => void refresh()}>
                {t("teams.retry")}
              </Button>
            </div>
          </Surface>
        ) : null}
        <div className="grid gap-5 xl:grid-cols-[minmax(15rem,0.34fr)_minmax(0,1fr)]">
          <Surface className="!p-0 overflow-hidden">
            <div className="border-b border-m3-border p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-m3-text">{t("teams.allTeams")}</p>
                  <p className="mt-0.5 text-xs text-m3-secondary">
                    {t("teams.count", { count: teams.length })}
                  </p>
                </div>
                <Users className="h-4 w-4 text-m3-primary" aria-hidden />
              </div>
              <label className="relative block">
                <Search
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-m3-secondary"
                  aria-hidden
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={t("teams.search")}
                  className="h-10 w-full rounded-md border border-m3-border bg-m3-bg pl-9 pr-3 text-sm text-m3-text outline-none focus:border-m3-primary focus:ring-2 focus:ring-m3-primary/20"
                />
              </label>
            </div>
            <div className="max-h-[34rem] overflow-y-auto p-2">
              {filteredTeams.length ? (
                filteredTeams.map((team) => {
                  const current = team.id === selected?.id;
                  return (
                    <button
                      key={team.id}
                      type="button"
                      onClick={() => setSelectedId(team.id)}
                      className={`mb-1 flex w-full items-center gap-3 rounded-md px-3 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-m3-primary ${current ? "bg-m3-primary/10 text-m3-primary" : "text-m3-text hover:bg-m3-hover"}`}
                      aria-current={current ? "true" : undefined}
                    >
                      <span
                        className={`grid h-10 w-10 shrink-0 place-items-center rounded-md ${current ? "bg-m3-primary text-white" : "bg-m3-sidebar text-m3-secondary"}`}
                      >
                        <Users className="h-4 w-4" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{team.name}</span>
                        <span className="mt-1 block text-xs text-m3-secondary">
                          {t("teams.memberCount", { count: team.memberCount })}
                        </span>
                      </span>
                      {team.id === activeTeamId ? (
                        <span
                          className="h-2 w-2 rounded-full bg-m3-primary"
                          aria-label={t("teams.active")}
                        />
                      ) : null}
                    </button>
                  );
                })
              ) : (
                <div className="px-4 py-10 text-center">
                  <Users className="mx-auto h-7 w-7 text-m3-secondary/70" aria-hidden />
                  <p className="mt-3 text-sm font-medium text-m3-text">
                    {teams.length ? t("teams.noSearchResults") : t("teams.emptyTitle")}
                  </p>
                  <p className="mt-1 text-xs text-m3-secondary">
                    {teams.length ? t("teams.noSearchDesc") : t("teams.emptyDesc")}
                  </p>
                  {!teams.length && canCreate ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() => setCreateOpen(true)}
                    >
                      {t("teams.createFirst")}
                    </Button>
                  ) : null}
                </div>
              )}
            </div>
          </Surface>

          {selected ? (
            <section className="min-w-0 space-y-5">
              <Surface className="overflow-hidden !p-0">
                <div className="border-b border-m3-border bg-m3-sidebar/60 px-5 py-5 sm:px-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-m3-primary text-white">
                        <Users className="h-5 w-5" aria-hidden />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-m3-secondary">
                          {t("teams.teamLabel")}
                        </p>
                        <h2 className="mt-1 truncate text-xl font-semibold text-m3-text">
                          {selected.name}
                        </h2>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {canManage(selected, "update") ? (
                        <form onSubmit={renameTeam} className="flex items-center gap-2">
                          <Input
                            aria-label={t("teams.renameLabel")}
                            value={renameDraft}
                            onChange={(event) => setRenameDraft(event.target.value)}
                            placeholder={t("teams.renamePlaceholder")}
                          />
                          <Button
                            type="submit"
                            size="sm"
                            variant="outline"
                            disabled={saving || !renameDraft.trim()}
                          >
                            {t("teams.rename")}
                          </Button>
                        </form>
                      ) : null}
                      {canManage(selected, "delete") ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setConfirm({ kind: "team", team: selected })}
                        >
                          {t("teams.delete")}
                        </Button>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-m3-secondary">
                    <span className="inline-flex items-center gap-2">
                      <Users className="h-4 w-4 text-m3-primary" aria-hidden />
                      {t("teams.memberCount", { count: selected.memberCount })}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <Shield className="h-4 w-4 text-m3-primary" aria-hidden />
                      {t("teams.privateToOrg")}
                    </span>
                    <span>
                      {t("teams.createdAt", {
                        date: new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
                          new Date(selected.createdAt),
                        ),
                      })}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6">
                  <div>
                    <p className="text-sm font-semibold text-m3-text">
                      {t("teams.activeTeamTitle")}
                    </p>
                    <p className="mt-0.5 text-xs text-m3-secondary">{t("teams.activeTeamDesc")}</p>
                  </div>
                  {selected.id === activeTeamId ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-m3-primary/10 px-3 py-1.5 text-xs font-semibold text-m3-primary">
                      <Check className="h-3.5 w-3.5" aria-hidden />
                      {t("teams.active")}
                    </span>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={saving}
                      onClick={() => void setActive(selected)}
                    >
                      {t("teams.setActive")}
                    </Button>
                  )}
                </div>
              </Surface>

              <Surface>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold text-m3-text">
                      {t("teams.membersTitle")}
                    </h3>
                    <p className="mt-1 text-sm text-m3-secondary">{t("teams.membersDesc")}</p>
                  </div>
                  {canManage(selected, "update") ? (
                    <form onSubmit={addMember} className="flex w-full gap-2 sm:w-auto">
                      <select
                        value={addUserId}
                        onChange={(event) => setAddUserId(event.target.value)}
                        className="h-10 min-w-0 flex-1 rounded-md border border-m3-border bg-m3-bg px-3 text-sm text-m3-text sm:w-56"
                        aria-label={t("teams.chooseMember")}
                      >
                        <option value="">{t("teams.chooseMember")}</option>
                        {addableMembers.map((member) => (
                          <option key={member.userId} value={member.userId}>
                            {member.user?.name || member.user?.email || member.userId}
                          </option>
                        ))}
                      </select>
                      <Button
                        type="submit"
                        size="sm"
                        disabled={saving || !addUserId}
                        icon={<UserPlus className="h-4 w-4" />}
                      >
                        {t("teams.addMember")}
                      </Button>
                    </form>
                  ) : null}
                </div>
                {selected.members.length ? (
                  <ul className="mt-5 divide-y divide-m3-border">
                    {selected.members.map((member) => {
                      const orgMember = candidateMembers.find(
                        (item) => item.userId === member.userId,
                      );
                      const canRemove = canManage(selected, "update") && member.userId !== user?.id;
                      return (
                        <li key={member.id} className="flex items-center gap-3 py-3">
                          <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-m3-sidebar text-sm font-semibold text-m3-secondary">
                            {member.image ? (
                              <img
                                src={member.image}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              member.name?.trim().slice(0, 1).toUpperCase() || "?"
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-m3-text">
                              {member.name || member.email || t("teams.unnamedMember")}
                              {member.userId === user?.id ? (
                                <span className="ml-2 text-xs font-normal text-m3-secondary">
                                  {t("teams.you")}
                                </span>
                              ) : null}
                            </p>
                            <p className="truncate text-xs text-m3-secondary">
                              {member.email ||
                                t("teams.roleLabel", { role: orgMember?.role ?? "member" })}
                            </p>
                          </div>
                          <span className="hidden rounded-full bg-m3-sidebar px-2.5 py-1 text-xs text-m3-secondary sm:inline-flex">
                            {t("teams.roleLabel", { role: orgMember?.role ?? "member" })}
                          </span>
                          {canRemove ? (
                            <button
                              type="button"
                              onClick={() =>
                                setConfirm({
                                  kind: "member",
                                  team: selected,
                                  userId: member.userId,
                                })
                              }
                              className="rounded-md p-2 text-m3-secondary hover:bg-m3-danger/10 hover:text-m3-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-m3-primary"
                              aria-label={t("teams.removeMember", {
                                name: member.name || member.email || "",
                              })}
                            >
                              <UserMinus className="h-4 w-4" aria-hidden />
                            </button>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="mt-5 rounded-lg border border-dashed border-m3-border px-5 py-9 text-center">
                    <Users className="mx-auto h-6 w-6 text-m3-secondary" aria-hidden />
                    <p className="mt-2 text-sm font-medium text-m3-text">{t("teams.noMembers")}</p>
                    {canManage(selected, "update") ? (
                      <p className="mt-1 text-xs text-m3-secondary">{t("teams.noMembersDesc")}</p>
                    ) : null}
                  </div>
                )}
              </Surface>
            </section>
          ) : (
            <Surface className="grid min-h-72 place-items-center text-center">
              <div>
                <Users className="mx-auto h-8 w-8 text-m3-secondary" aria-hidden />
                <p className="mt-3 text-sm font-medium text-m3-text">{t("teams.chooseTeam")}</p>
              </div>
            </Surface>
          )}
        </div>
        {createOpen ? (
          <div
            className="fixed inset-0 z-40 grid place-items-center bg-black/40 p-4"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setCreateOpen(false);
            }}
          >
            <form
              onSubmit={createTeam}
              className="w-full max-w-md rounded-xl border border-m3-border bg-m3-card p-5 shadow-float-lg"
              role="dialog"
              aria-modal="true"
              aria-labelledby="create-team-title"
            >
              <h2 id="create-team-title" className="text-lg font-semibold text-m3-text">
                {t("teams.createTitle")}
              </h2>
              <p className="mt-1 text-sm text-m3-secondary">{t("teams.createDesc")}</p>
              <Input
                autoFocus
                label={t("teams.nameLabel")}
                value={nameDraft}
                onChange={(event) => setNameDraft(event.target.value)}
                maxLength={80}
                required
                className="mt-5"
              />
              <div className="mt-5 flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>
                  {t("common.back")}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={saving}
                  disabled={!nameDraft.trim()}
                  icon={<Plus className="h-4 w-4" />}
                >
                  {t("teams.create")}
                </Button>
              </div>
            </form>
          </div>
        ) : null}
        <ConfirmDialog
          isOpen={Boolean(confirm)}
          onClose={() => setConfirm(null)}
          onConfirm={() => void confirmAction()}
          isLoading={saving}
          title={
            confirm?.kind === "team" ? t("teams.deleteConfirmTitle") : t("teams.removeConfirmTitle")
          }
          message={
            confirm?.kind === "team"
              ? t("teams.deleteConfirmDesc", { name: confirm.team.name })
              : t("teams.removeConfirmDesc")
          }
          confirmText={confirm?.kind === "team" ? t("teams.delete") : t("teams.remove")}
          cancelText={t("common.back")}
        />
      </div>
    </AccountCenter>
  );
}
