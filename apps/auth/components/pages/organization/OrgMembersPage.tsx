"use client";

import { AccountCenter } from "@/components/account/AccountCenter";
import { useActiveOrganization, type OrgMember } from "@/hooks/useActiveOrganization";
import { authClient } from "@/lib/auth-client";
import { useI18n } from "@/lib/i18n";
import { orgInitials, roleLabel, selectClass } from "@/lib/org-ui";
import type { AppRole } from "@hosanna/auth";
import {
  Badge,
  Button,
  Can,
  CanAny,
  Input,
  Modal,
  PageHeader,
  Spinner,
  Surface,
  Tabs,
} from "@hosanna/ui";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  Mail,
  PenLine,
  RefreshCw,
  Search,
  Send,
  Shield,
  Trash2,
  UserPlus,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const INVITE_ROLES: AppRole[] = ["admin", "teamLeader", "editor", "musician", "member", "guest"];

type OrgInvitation = {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt?: string | Date;
};

type SubTab = "members" | "invites";

export function OrgMembersPage() {
  const { t, locale } = useI18n();
  const {
    user,
    organization,
    capabilities,
    isLoading,
    refresh,
  } = useActiveOrganization();

  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [subTab, setSubTab] = useState<SubTab>("members");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [invitations, setInvitations] = useState<OrgInvitation[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AppRole>("member");
  const [isInviting, setIsInviting] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [cancelInvite, setCancelInvite] = useState<OrgInvitation | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [editingRole, setEditingRole] = useState(false);
  const [draftRole, setDraftRole] = useState("member");
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [busy, setBusy] = useState(false);

  const showToast = useCallback((msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    window.setTimeout(() => setToast(null), 3500);
  }, []);

  const members = organization?.members ?? [];

  const selected = useMemo(
    () => (selectedId ? members.find((m) => m.id === selectedId) ?? null : null),
    [members, selectedId],
  );

  useEffect(() => {
    if (selectedId && organization && !members.some((m) => m.id === selectedId)) {
      setSelectedId(null);
      setEditingRole(false);
    }
  }, [selectedId, organization, members]);

  const fetchInvitations = useCallback(async () => {
    if (!organization?.id || !capabilities.canManageInvites) {
      setInvitations([]);
      return;
    }
    setLoadingInvites(true);
    try {
      const { data } = await authClient.organization.listInvitations({
        query: { organizationId: organization.id },
      });
      setInvitations(((data as OrgInvitation[]) || []).filter((i) => i.status === "pending"));
    } catch {
      setInvitations([]);
    } finally {
      setLoadingInvites(false);
    }
  }, [organization?.id, capabilities.canManageInvites]);

  useEffect(() => {
    void fetchInvitations();
  }, [fetchInvitations]);

  const pendingInvites = invitations;

  const tabItems = useMemo(() => {
    const items = [
      {
        id: "members",
        label: t("settings.members.activeMembers", { count: members.length }),
      },
    ];
    if (capabilities.canManageInvites) {
      items.push({
        id: "invites",
        label: t("settings.members.pendingInvites", { count: pendingInvites.length }),
      });
    }
    return items;
  }, [t, members.length, pendingInvites.length, capabilities.canManageInvites]);

  const filteredMembers = members.filter((m) => {
    const name = (m.user?.name || "").toLowerCase();
    const email = (m.user?.email || "").toLowerCase();
    const q = searchQuery.toLowerCase();
    return name.includes(q) || email.includes(q);
  });

  const filteredInvites = pendingInvites.filter((i) =>
    i.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const openMember = (member: OrgMember) => {
    setSelectedId(member.id);
    setEditingRole(false);
    setDraftRole(member.role);
    setConfirmRemove(false);
    setConfirmLeave(false);
  };

  const closeMember = () => {
    setSelectedId(null);
    setEditingRole(false);
    setConfirmRemove(false);
    setConfirmLeave(false);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setIsInviting(true);
    try {
      const { error } = await authClient.organization.inviteMember({
        email: inviteEmail.trim(),
        role: inviteRole,
      });
      if (error) {
        showToast(t("settings.members.inviteError", { email: inviteEmail }), "error");
        return;
      }
      showToast(t("settings.members.inviteSuccess", { email: inviteEmail }), "success");
      setInviteEmail("");
      setInviteRole("member");
      setIsInviteOpen(false);
      await fetchInvitations();
    } catch (err) {
      showToast(
        (err as Error).message || t("settings.members.inviteError", { email: inviteEmail }),
        "error",
      );
    } finally {
      setIsInviting(false);
    }
  };

  const handleResend = async (invite: OrgInvitation) => {
    setResendingId(invite.id);
    try {
      const { error } = await authClient.organization.inviteMember({
        email: invite.email,
        role: invite.role as AppRole,
        organizationId: organization?.id,
        resend: true,
      });
      if (error) {
        showToast(t("settings.members.resendError", { email: invite.email }), "error");
      } else {
        showToast(t("settings.members.resendSuccess", { email: invite.email }), "success");
        await fetchInvitations();
      }
    } catch {
      showToast(t("settings.members.resendError", { email: invite.email }), "error");
    } finally {
      setResendingId(null);
    }
  };

  const confirmCancel = async () => {
    if (!cancelInvite) return;
    setIsCancelling(true);
    try {
      await authClient.organization.cancelInvitation({ invitationId: cancelInvite.id });
      showToast(
        t("settings.members.inviteCancelled", { email: cancelInvite.email }),
        "success",
      );
      await fetchInvitations();
    } catch (err) {
      showToast(
        t("settings.members.cancelError", {
          error: (err as Error).message || "",
        }),
        "error",
      );
    } finally {
      setIsCancelling(false);
      setCancelInvite(null);
    }
  };

  const handleRoleSave = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      await authClient.organization.updateMemberRole({
        memberId: selected.id,
        role: draftRole as "owner" | "admin" | "member",
      });
      showToast(t("settings.members.roleUpdated"), "success");
      setEditingRole(false);
      await refresh();
    } catch (err) {
      showToast(
        t("settings.members.roleUpdateError", {
          error: (err as Error).message || "",
        }),
        "error",
      );
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      await authClient.organization.removeMember({
        memberIdOrEmail: selected.id || selected.user?.email || "",
      });
      showToast(t("settings.members.memberRemoved"), "success");
      setConfirmRemove(false);
      setSelectedId(null);
      await refresh();
    } catch (err) {
      showToast(
        t("settings.members.memberRemoveError", {
          error: (err as Error).message || "",
        }),
        "error",
      );
    } finally {
      setBusy(false);
    }
  };

  const handleLeave = async () => {
    setBusy(true);
    try {
      await authClient.organization.leave({
        organizationId: organization?.id || "",
      });
      showToast(t("settings.memberProfile.leaveSuccess"), "success");
      setConfirmLeave(false);
      setSelectedId(null);
      window.location.assign("/onboarding");
    } catch (err) {
      showToast(
        t("settings.memberProfile.leaveError", {
          error: (err as Error).message || "",
        }),
        "error",
      );
    } finally {
      setBusy(false);
    }
  };

  const formatRelativeDays = (date?: string | Date) => {
    if (!date) return "";
    const diffDays = Math.round((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return t("settings.members.today");
    if (diffDays > 0) return t("settings.members.inDays", { count: diffDays });
    return t("settings.members.daysAgo", { count: Math.abs(diffDays) });
  };

  if (isLoading && !organization) {
    return (
      <AccountCenter>
        <div className="flex justify-center py-16">
          <Spinner size="md" label={t("common.loading")} />
        </div>
      </AccountCenter>
    );
  }

  if (!organization) {
    return (
      <AccountCenter>
        <Surface>
          <p className="text-sm text-m3-secondary">{t("org.noOrganization")}</p>
        </Surface>
      </AccountCenter>
    );
  }

  if (selected) {
    const isSelf = user?.id === selected.userId;
    const name = selected.user?.name || selected.user?.email || t("settings.members.memberRole");
    const joined = selected.createdAt
      ? new Intl.DateTimeFormat(locale, {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }).format(new Date(selected.createdAt))
      : null;
    const promotingOwner =
      editingRole && draftRole === "owner" && selected.role !== "owner";
    const showDanger = isSelf || capabilities.canManageMembers;
    const canEditRole = capabilities.canManageMembers && !isSelf;
    const userId = selected.userId || selected.user?.id || null;

    return (
      <AccountCenter toast={toast}>
        <div className="space-y-6">
          <button
            type="button"
            onClick={closeMember}
            className="flex items-center gap-2 text-xs font-semibold text-m3-secondary hover:text-m3-text cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("settings.memberProfile.backToList")}
          </button>

          <div className="rounded-2xl border border-m3-border/70 bg-m3-card shadow-sm">
            <div className="relative h-28 overflow-hidden rounded-t-2xl bg-gradient-to-r from-sky-800 via-indigo-800 to-slate-900 sm:h-32">
              <div
                className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-sky-400/20 blur-3xl"
                aria-hidden
              />
            </div>
            <div className="relative z-10 px-5 pb-6 sm:px-7">
              <div className="-mt-12 mb-4 flex flex-wrap items-end justify-between gap-3">
                <div className="relative z-10 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-4 border-m3-card bg-m3-primary/15 text-xl font-semibold text-m3-primary shadow-md sm:h-24 sm:w-24 sm:text-2xl">
                  {selected.user?.image ? (
                    <img
                      src={selected.user.image}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    orgInitials(name)
                  )}
                </div>
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  {isSelf ? (
                    <Badge variant="neutral" size="sm">
                      {t("settings.members.you")}
                    </Badge>
                  ) : null}
                  <Badge variant="accent" size="md">
                    {roleLabel(selected.role, t)}
                  </Badge>
                </div>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0 space-y-2">
                  <h2 className="truncate text-2xl font-semibold tracking-tight text-m3-text sm:text-3xl">
                    {name}
                  </h2>
                  {selected.user?.email ? (
                    <p className="flex items-center gap-1.5 truncate text-sm text-m3-secondary">
                      <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      {selected.user.email}
                    </p>
                  ) : null}
                  {joined ? (
                    <p className="flex items-center gap-1.5 text-xs text-m3-secondary">
                      <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      {t("settings.memberProfile.memberSince", { date: joined })}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  {isSelf ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmLeave(true)}
                    >
                      {t("settings.memberProfile.leaveOrg")}
                    </Button>
                  ) : (
                    <Can permission="member.delete">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setConfirmRemove(true)}
                        icon={<Trash2 className="h-3.5 w-3.5 text-m3-danger" />}
                      >
                        {t("settings.memberProfile.removeMember")}
                      </Button>
                    </Can>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Can
              permission="member.update"
              fallback={
                <Surface className="space-y-3">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-m3-text">
                    <Shield className="h-4 w-4 text-m3-primary" aria-hidden />
                    {t("settings.memberProfile.rbacTitle")}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-m3-secondary">
                      {t("settings.memberProfile.currentRole")}
                    </span>
                    <Badge variant="accent" size="md">
                      {roleLabel(selected.role, t)}
                    </Badge>
                  </div>
                </Surface>
              }
            >
              <Surface className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-2">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-m3-text">
                      <Shield className="h-4 w-4 text-m3-primary" aria-hidden />
                      {t("settings.memberProfile.rbacTitle")}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-m3-secondary">
                        {t("settings.memberProfile.currentRole")}
                      </span>
                      <Badge variant="accent" size="md">
                        {roleLabel(selected.role, t)}
                      </Badge>
                    </div>
                  </div>
                  {canEditRole && !editingRole ? (
                    <button
                      type="button"
                      onClick={() => {
                        setDraftRole(selected.role);
                        setEditingRole(true);
                      }}
                      className="inline-flex shrink-0 cursor-pointer items-center gap-1 text-xs font-semibold text-m3-primary hover:underline"
                    >
                      <PenLine className="h-3.5 w-3.5" />
                      {t("settings.memberProfile.changeRole")}
                    </button>
                  ) : null}
                </div>

                {canEditRole && editingRole ? (
                  <div className="space-y-3 border-t border-m3-border/60 pt-4">
                    <div>
                      <label className="text-label mb-1.5 block">
                        {t("settings.members.roleLabel")}
                      </label>
                      <select
                        value={draftRole}
                        onChange={(e) => setDraftRole(e.target.value)}
                        className={selectClass}
                        disabled={busy}
                      >
                        {capabilities.isOwner ? (
                          <option value="owner">{t("settings.roles.owner")}</option>
                        ) : null}
                        <option value="admin">{t("settings.roles.admin")}</option>
                        <option value="teamLeader">{t("settings.roles.teamLeader")}</option>
                        <option value="editor">{t("settings.roles.editor")}</option>
                        <option value="musician">{t("settings.roles.musician")}</option>
                        <option value="member">{t("settings.roles.member")}</option>
                        <option value="guest">{t("settings.roles.guest")}</option>
                      </select>
                    </div>

                    {promotingOwner ? (
                      <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                        <p>{t("settings.memberProfile.promoteOwnerWarning", { name })}</p>
                      </div>
                    ) : null}

                    <div className="flex justify-end gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busy}
                        onClick={() => {
                          setEditingRole(false);
                          setDraftRole(selected.role);
                        }}
                      >
                        {t("common.cancel")}
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        isLoading={busy}
                        disabled={draftRole === selected.role}
                        onClick={() => void handleRoleSave()}
                      >
                        {t("settings.memberProfile.saveRole")}
                      </Button>
                    </div>
                  </div>
                ) : null}
              </Surface>
            </Can>

            <Surface className="space-y-4">
              <h3 className="text-sm font-semibold text-m3-text">
                {t("settings.memberProfile.detailsTitle")}
              </h3>
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {userId ? (
                  <div className="rounded-xl border border-m3-border/60 bg-m3-sidebar/35 px-3.5 py-3">
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-m3-secondary">
                      {t("settings.memberProfile.userId")}
                    </dt>
                    <dd className="mt-1 break-all font-mono text-xs text-m3-text">{userId}</dd>
                  </div>
                ) : null}
                {selected.id ? (
                  <div className="rounded-xl border border-m3-border/60 bg-m3-sidebar/35 px-3.5 py-3">
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-m3-secondary">
                      {t("settings.memberProfile.memberId")}
                    </dt>
                    <dd className="mt-1 break-all font-mono text-xs text-m3-text">{selected.id}</dd>
                  </div>
                ) : null}
                {joined ? (
                  <div className="rounded-xl border border-m3-border/60 bg-m3-sidebar/35 px-3.5 py-3 sm:col-span-2">
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-m3-secondary">
                      {t("settings.memberProfile.joinedLabel")}
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-m3-text">{joined}</dd>
                  </div>
                ) : null}
              </dl>

              {showDanger && !isSelf ? (
                <Can permission="member.delete">
                  <div className="space-y-3 rounded-xl border border-m3-danger/20 bg-m3-danger/[0.03] px-3.5 py-3.5">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-m3-danger" aria-hidden />
                      <h4 className="text-sm font-semibold text-m3-danger">
                        {t("org.danger.title")}
                      </h4>
                    </div>
                    <p className="text-xs text-m3-secondary">
                      {t("settings.memberProfile.removeConfirmText", { name })}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmRemove(true)}
                      icon={<Trash2 className="h-3.5 w-3.5 text-m3-danger" />}
                    >
                      {t("settings.memberProfile.removeMember")}
                    </Button>
                  </div>
                </Can>
              ) : null}

              {isSelf ? (
                <div className="space-y-3 rounded-xl border border-m3-danger/20 bg-m3-danger/[0.03] px-3.5 py-3.5">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-m3-danger" aria-hidden />
                    <h4 className="text-sm font-semibold text-m3-danger">
                      {t("org.danger.title")}
                    </h4>
                  </div>
                  <p className="text-xs text-m3-secondary">{t("org.danger.leaveDesc")}</p>
                  <Button variant="outline" size="sm" onClick={() => setConfirmLeave(true)}>
                    {t("settings.memberProfile.leaveOrg")}
                  </Button>
                </div>
              ) : null}
            </Surface>
          </div>

          <Modal
            isOpen={confirmRemove}
            onClose={() => setConfirmRemove(false)}
            title={t("settings.memberProfile.removeConfirmTitle")}
          >
            <div className="space-y-4 pt-2">
              <p className="text-sm text-m3-secondary">
                {t("settings.memberProfile.removeConfirmText", { name })}
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setConfirmRemove(false)}>
                  {t("common.back")}
                </Button>
                <Button
                  variant="primary"
                  isLoading={busy}
                  onClick={() => void handleRemove()}
                >
                  {t("settings.memberProfile.removeMember")}
                </Button>
              </div>
            </div>
          </Modal>

          <Modal
            isOpen={confirmLeave}
            onClose={() => setConfirmLeave(false)}
            title={t("settings.memberProfile.leaveConfirmTitle")}
          >
            <div className="space-y-4 pt-2">
              <p className="text-sm text-m3-secondary">
                {t("settings.memberProfile.leaveConfirmText")}
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setConfirmLeave(false)}>
                  {t("common.back")}
                </Button>
                <Button
                  variant="primary"
                  isLoading={busy}
                  onClick={() => void handleLeave()}
                >
                  {t("settings.memberProfile.leaveOrg")}
                </Button>
              </div>
            </div>
          </Modal>
        </div>
      </AccountCenter>
    );
  }

  return (
    <AccountCenter toast={toast}>
      <div className="space-y-5">
        <PageHeader
          title={t("org.members.title")}
          description={t("org.members.desc")}
        />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <Tabs
            items={tabItems}
            value={subTab}
            onChange={(id) => setSubTab(id as SubTab)}
            className="flex-1 min-w-0"
          />
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                void refresh();
                void fetchInvitations();
              }}
              className="p-2 text-m3-secondary hover:text-m3-text rounded-md hover:bg-m3-sidebar cursor-pointer"
              title={t("common.refresh")}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <CanAny permissions={["invitation.create"]}>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsInviteOpen(true)}
                icon={<UserPlus className="w-4 h-4" />}
              >
                {t("settings.members.inviteMember")}
              </Button>
            </CanAny>
          </div>
        </div>

        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={
            subTab === "members"
              ? t("settings.members.searchPlaceholder")
              : t("settings.members.searchInvitesPlaceholder")
          }
          icon={<Search className="w-4 h-4" />}
        />

        {subTab === "members" ? (
          filteredMembers.length === 0 ? (
            <p className="py-12 text-center text-sm text-m3-secondary">
              {t("settings.members.noMembers")}
            </p>
          ) : (
            <div className="divide-y divide-m3-border/50 border border-m3-border rounded-xl overflow-hidden bg-m3-card w-full">
              {filteredMembers.map((member) => {
                const name =
                  member.user?.name || member.user?.email || t("settings.members.memberRole");
                const isSelf = user?.id === member.userId;
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => openMember(member)}
                    className="w-full flex items-center gap-3 px-3 sm:px-4 py-2.5 text-left hover:bg-m3-sidebar/50 transition-colors cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-full bg-m3-primary/15 text-m3-primary text-xs font-semibold flex items-center justify-center overflow-hidden shrink-0">
                      {member.user?.image ? (
                        <img
                          src={member.user.image}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        orgInitials(name)
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-m3-text truncate">
                        {name}
                        {isSelf ? (
                          <span className="text-m3-secondary font-normal">
                            {" "}
                            · {t("settings.members.you")}
                          </span>
                        ) : null}
                      </p>
                      <p className="text-xs text-m3-secondary truncate">
                        {member.user?.email}
                      </p>
                    </div>
                    <Badge variant="neutral" size="sm" className="shrink-0">
                      {roleLabel(member.role, t)}
                    </Badge>
                  </button>
                );
              })}
            </div>
          )
        ) : null}

        {subTab === "invites" ? (
          <CanAny
            permissions={["invitation.create", "invitation.cancel"]}
            fallback={
              <Surface className="py-10 text-center">
                <p className="text-sm text-m3-secondary">{t("settings.members.noInviteAccess")}</p>
              </Surface>
            }
          >
            {loadingInvites && invitations.length === 0 ? (
              <div className="py-12 flex justify-center">
                <Spinner size="md" label={t("settings.members.loadingInvites")} />
              </div>
            ) : filteredInvites.length === 0 ? (
              <p className="py-12 text-center text-sm text-m3-secondary">
                {t("settings.members.noInvites")}
              </p>
            ) : (
              <div className="divide-y divide-m3-border/50 border border-m3-border rounded-xl overflow-hidden bg-m3-card w-full">
                {filteredInvites.map((invite) => {
                  const expired = invite.expiresAt
                    ? new Date(invite.expiresAt).getTime() < Date.now()
                    : false;
                  return (
                    <div
                      key={invite.id}
                      className="flex items-center gap-3 px-3 sm:px-4 py-2.5"
                    >
                      <div className="w-9 h-9 rounded-full bg-m3-sidebar text-m3-secondary flex items-center justify-center shrink-0">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-m3-text truncate">{invite.email}</p>
                        <p className="text-xs text-m3-secondary">
                          {expired
                            ? t("settings.members.expired")
                            : invite.expiresAt
                              ? t("settings.members.expires", {
                                  date: formatRelativeDays(invite.expiresAt),
                                })
                              : null}
                        </p>
                      </div>
                      <Badge variant="neutral" size="sm" className="shrink-0 hidden sm:inline-flex">
                        {roleLabel(invite.role, t)}
                      </Badge>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <Can permission="invitation.create">
                          <button
                            type="button"
                            onClick={() => void handleResend(invite)}
                            disabled={resendingId === invite.id}
                            className="p-2 text-m3-secondary hover:text-m3-primary rounded-md hover:bg-m3-sidebar cursor-pointer disabled:opacity-50"
                            title={t("settings.members.resendInviteTitle")}
                          >
                            {resendingId === invite.id ? (
                              <Spinner size="sm" />
                            ) : (
                              <Send className="w-4 h-4" />
                            )}
                          </button>
                        </Can>
                        <Can permission="invitation.cancel">
                          <button
                            type="button"
                            onClick={() => setCancelInvite(invite)}
                            className="p-2 text-m3-secondary hover:text-rose-500 rounded-md hover:bg-m3-sidebar cursor-pointer"
                            title={t("settings.members.cancelInviteTitle")}
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </Can>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CanAny>
        ) : null}

        <Modal
          isOpen={isInviteOpen}
          onClose={() => setIsInviteOpen(false)}
          title={t("settings.members.inviteModalTitle")}
        >
          <form onSubmit={(e) => void handleInvite(e)} className="space-y-4 pt-2">
            <Input
              type="email"
              label={t("settings.members.emailLabel")}
              placeholder={t("settings.members.emailPlaceholder")}
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              autoFocus
              required
            />
            <div>
              <label className="text-label block mb-1.5">{t("settings.members.roleLabel")}</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as AppRole)}
                className={selectClass}
              >
                {INVITE_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {roleLabel(role, t)}
                  </option>
                ))}
                {capabilities.isOwner ? (
                  <option value="owner">{t("settings.roles.owner")}</option>
                ) : null}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" type="button" onClick={() => setIsInviteOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button variant="primary" type="submit" disabled={isInviting} isLoading={isInviting}>
                {isInviting ? t("settings.members.sending") : t("settings.members.sendInvite")}
              </Button>
            </div>
          </form>
        </Modal>

        <Modal
          isOpen={!!cancelInvite}
          onClose={() => setCancelInvite(null)}
          title={t("settings.members.cancelModalTitle")}
        >
          <div className="space-y-4 pt-2">
            <p className="text-sm text-m3-secondary">
              {cancelInvite
                ? t("settings.members.cancelModalConfirm", { email: cancelInvite.email })
                : null}
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCancelInvite(null)}>
                {t("common.back")}
              </Button>
              <Button
                variant="primary"
                onClick={() => void confirmCancel()}
                disabled={isCancelling}
                isLoading={isCancelling}
              >
                {t("settings.members.confirmCancel")}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AccountCenter>
  );
}
