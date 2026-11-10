"use client";

import { AccountCenter } from "@/components/account/AccountCenter";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { authClient } from "@/lib/auth-client";
import { useI18n } from "@/lib/i18n";
import {
  notificationsApi,
  type CreateNotificationInput,
  type NotificationChannel,
} from "@/lib/notifications-api";
import type { AppRole } from "@hosanna/auth";
import { Button, Input, PageHeader, Spinner, Surface, useCan } from "@hosanna/ui";
import {
  Bell,
  Building2,
  CreditCard,
  Info,
  Link2,
  Lock,
  MessageSquare,
  Search,
  Send,
  Shield,
  Smartphone,
  User as UserIcon,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";

type Target = "user" | "org";
type TypePreset = "info" | "organization" | "team" | "security" | "billing";

type Recipient = {
  userId: string;
  name: string;
  email: string;
  role: string;
  image?: string | null;
};

const TYPE_PRESETS: { value: TypePreset; icon: ReactNode }[] = [
  { value: "info", icon: <Info className="w-3.5 h-3.5" /> },
  { value: "organization", icon: <Building2 className="w-3.5 h-3.5" /> },
  { value: "team", icon: <Users className="w-3.5 h-3.5" /> },
  { value: "security", icon: <Shield className="w-3.5 h-3.5" /> },
  { value: "billing", icon: <CreditCard className="w-3.5 h-3.5" /> },
];

const ORG_ROLES: AppRole[] = [
  "owner",
  "admin",
  "teamLeader",
  "editor",
  "musician",
  "member",
  "guest",
];

const CHANNELS: { value: NotificationChannel; icon: ReactNode }[] = [
  { value: "inbox", icon: <Bell className="w-4 h-4" /> },
  { value: "push", icon: <Smartphone className="w-4 h-4" /> },
  { value: "both", icon: <MessageSquare className="w-4 h-4" /> },
];

const MAX_SEARCH_RESULTS = 40;

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

export function OrgNotificationsPage() {
  const { t } = useI18n();
  const { organization, isLoading } = useActiveOrganization();

  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [target, setTarget] = useState<Target>("org");
  const [query, setQuery] = useState("");
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [members, setMembers] = useState<Recipient[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<AppRole[]>([]);
  const [typePreset, setTypePreset] = useState<TypePreset>("info");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [href, setHref] = useState("");
  const [channel, setChannel] = useState<NotificationChannel>("inbox");
  const [isSending, setIsSending] = useState(false);

  const { granted: canSend } = useCan("notification.sent");
  const isOrgTarget = target === "org";
  const showTypeField = isOrgTarget || channel !== "push";

  const showToast = useCallback((msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    window.setTimeout(() => setToast(null), 3500);
  }, []);

  const loadMembers = useCallback(async () => {
    if (!organization) return;
    setIsLoadingMembers(true);
    setMembersError(null);
    try {
      const embedded = organization.members;
      if (embedded && embedded.length > 0) {
        setMembers(
          embedded.map((m) => ({
            userId: m.userId,
            name: m.user?.name || m.user?.email || m.userId,
            email: m.user?.email || "",
            role: m.role,
            image: m.user?.image,
          })),
        );
        return;
      }

      const { data, error } = await authClient.organization.listMembers({
        query: { organizationId: organization.id, limit: 200 },
      });
      if (error) throw new Error(error.message);

      const rows =
        (data as unknown as { members?: Record<string, unknown>[] } | null)?.members ?? [];
      setMembers(
        rows.map((m) => {
          const user = (m.user ?? {}) as {
            id?: string;
            name?: string;
            email?: string;
            image?: string;
          };
          return {
            userId: (m.userId as string) || user.id || "",
            name: user.name || user.email || (m.userId as string) || "",
            email: user.email || "",
            role: (m.role as string) || "member",
            image: user.image,
          };
        }),
      );
    } catch (err) {
      setMembersError(
        err instanceof Error && err.message
          ? err.message
          : t("settings.notifications.recipient.loadError"),
      );
      setMembers([]);
    } finally {
      setIsLoadingMembers(false);
    }
  }, [organization, t]);

  useEffect(() => {
    if (
      canSend &&
      target === "user" &&
      members.length === 0 &&
      !isLoadingMembers &&
      !membersError
    ) {
      void loadMembers();
    }
  }, [canSend, target, members.length, isLoadingMembers, membersError, loadMembers]);

  const filteredMembers = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? members.filter((m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q))
      : members;
    return list.slice(0, MAX_SEARCH_RESULTS);
  }, [members, query]);

  const canSubmit =
    Boolean(organization) &&
    title.trim().length > 0 &&
    title.trim().length <= 255 &&
    (isOrgTarget || Boolean(recipient));

  const toggleRole = (role: AppRole) =>
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );

  const resetMessageFields = () => {
    setTypePreset("info");
    setTitle("");
    setDescription("");
    setHref("");
  };

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit || isSending || !organization) return;

    setIsSending(true);
    try {
      const payload: CreateNotificationInput = {
        type: showTypeField ? typePreset : "info",
        title: title.trim(),
      };
      if (description.trim()) payload.description = description.trim();
      if (href.trim()) payload.href = href.trim();

      if (isOrgTarget) {
        payload.organizationId = organization.id;
        payload.channel = "inbox";
        if (selectedRoles.length > 0) payload.roles = selectedRoles;
      } else if (recipient) {
        payload.userId = recipient.userId;
        payload.channel = channel;
        if (channel !== "inbox" && href.trim()) {
          payload.fcm = { data: { link: href.trim() } };
        }
      }

      const result = await notificationsApi.create(payload, {
        organizationId: organization.id,
      });
      showToast(
        result.push
          ? t("settings.notifications.sentPushToast", { count: result.push.sent })
          : t("settings.notifications.sentToast"),
        "success",
      );
      resetMessageFields();
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : t("settings.notifications.genericError");
      showToast(t("settings.notifications.errorToast", { error: message }), "error");
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
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

  if (!canSend) {
    return (
      <AccountCenter>
        <PageHeader
          title={t("accountOrg.notifications.title")}
          description={t("accountOrg.notifications.description")}
        />
        <Surface className="text-center py-10">
          <div className="w-10 h-10 mx-auto rounded-lg bg-m3-sidebar text-m3-secondary flex items-center justify-center mb-3">
            <Lock className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-m3-text">
            {t("settings.notifications.noAccessTitle")}
          </h3>
          <p className="text-sm text-m3-secondary mt-1 max-w-sm mx-auto">
            {t("settings.notifications.noAccessDesc")}
          </p>
        </Surface>
      </AccountCenter>
    );
  }

  const previewIcon =
    typePreset === "organization" ? (
      <Building2 className="w-4 h-4" />
    ) : typePreset === "team" ? (
      <Users className="w-4 h-4" />
    ) : typePreset === "security" ? (
      <Shield className="w-4 h-4" />
    ) : typePreset === "billing" ? (
      <CreditCard className="w-4 h-4" />
    ) : (
      <Info className="w-4 h-4" />
    );

  return (
    <AccountCenter toast={toast}>
      <form onSubmit={(e) => void handleSend(e)} className="space-y-6 pb-8">
        <PageHeader
          title={t("accountOrg.notifications.title")}
          description={t("accountOrg.notifications.description")}
        />

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-3 space-y-5">
            <Surface className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-m3-text">
                  {t("settings.notifications.recipient.title")}
                </h3>
                <p className="text-xs text-m3-secondary mt-0.5">
                  {t("settings.notifications.recipient.desc")}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-m3-sidebar">
                {(
                  [
                    {
                      value: "org" as const,
                      label: t("settings.notifications.recipient.organization"),
                      icon: <Building2 className="w-4 h-4" />,
                    },
                    {
                      value: "user" as const,
                      label: t("settings.notifications.recipient.user"),
                      icon: <UserIcon className="w-4 h-4" />,
                    },
                  ] as const
                ).map((opt) => {
                  const activeOpt = target === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setTarget(opt.value);
                        if (opt.value === "org") {
                          setChannel("inbox");
                          setRecipient(null);
                          setQuery("");
                        }
                      }}
                      className={`flex items-center justify-center gap-2 min-h-9 px-3 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                        activeOpt
                          ? "bg-m3-card text-m3-text shadow-sm"
                          : "text-m3-secondary hover:text-m3-text"
                      }`}
                    >
                      {opt.icon}
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {isOrgTarget ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-m3-border bg-m3-sidebar/50">
                    <div className="w-9 h-9 rounded-md bg-m3-primary/10 text-m3-primary flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-m3-text truncate">
                        {organization.name}
                      </p>
                      <p className="text-xs text-m3-secondary">
                        {t("settings.notifications.recipient.inboxOnly")}
                      </p>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <label className="text-xs font-medium text-m3-text">
                        {t("settings.notifications.recipient.rolesFilter")}
                      </label>
                      <span className="text-xs text-m3-secondary">
                        {selectedRoles.length === 0
                          ? t("settings.notifications.recipient.everyone")
                          : `${selectedRoles.length}`}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {ORG_ROLES.map((role) => {
                        const isSelected = selectedRoles.includes(role);
                        return (
                          <button
                            key={role}
                            type="button"
                            onClick={() => toggleRole(role)}
                            className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                              isSelected
                                ? "bg-m3-primary text-white border-m3-primary"
                                : "bg-m3-card text-m3-secondary border-m3-border hover:border-m3-primary/40"
                            }`}
                          >
                            {t(`settings.roles.${role}` as "settings.roles.owner")}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : recipient ? (
                <div className="flex items-center gap-3 p-3 rounded-lg border border-m3-primary/25 bg-m3-primary/5">
                  <div className="w-9 h-9 rounded-full bg-m3-primary/15 text-m3-primary text-xs font-semibold flex items-center justify-center shrink-0 overflow-hidden">
                    {recipient.image ? (
                      <img src={recipient.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      initials(recipient.name)
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-m3-text truncate">{recipient.name}</p>
                    <p className="text-xs text-m3-secondary truncate">{recipient.email}</p>
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-m3-secondary px-1.5 py-0.5 rounded bg-m3-sidebar border border-m3-border">
                    {t(`settings.roles.${recipient.role as AppRole}` as "settings.roles.owner")}
                  </span>
                  <button
                    type="button"
                    onClick={() => setRecipient(null)}
                    title={t("settings.notifications.recipient.clear")}
                    className="p-1.5 rounded-md text-m3-secondary hover:text-m3-text hover:bg-m3-hover cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-4 h-4 text-m3-secondary absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={t("settings.notifications.recipient.searchPlaceholder")}
                      className="w-full pl-9 pr-3 min-h-10 bg-m3-card border border-m3-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-m3-primary/25 focus:border-m3-primary"
                    />
                  </div>
                  <div className="max-h-56 overflow-y-auto rounded-md border border-m3-border divide-y divide-m3-border/60">
                    {isLoadingMembers ? (
                      <div className="py-8 flex justify-center">
                        <Spinner
                          size="sm"
                          label={t("settings.notifications.recipient.searching")}
                        />
                      </div>
                    ) : membersError ? (
                      <div className="py-8 text-center space-y-3">
                        <p className="text-sm text-m3-danger">{membersError}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          type="button"
                          onClick={() => void loadMembers()}
                        >
                          {t("common.retry")}
                        </Button>
                      </div>
                    ) : filteredMembers.length === 0 ? (
                      <p className="py-8 text-center text-sm text-m3-secondary">
                        {t("settings.notifications.recipient.noResults")}
                      </p>
                    ) : (
                      filteredMembers.map((member) => (
                        <button
                          key={member.userId}
                          type="button"
                          onClick={() => {
                            setRecipient(member);
                            setQuery("");
                          }}
                          className="w-full flex items-center gap-3 p-3 text-left hover:bg-m3-hover transition-colors cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-full bg-m3-primary/15 text-m3-primary text-xs font-semibold flex items-center justify-center shrink-0 overflow-hidden">
                            {member.image ? (
                              <img
                                src={member.image}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              initials(member.name)
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-m3-text truncate">
                              {member.name}
                            </p>
                            <p className="text-xs text-m3-secondary truncate">{member.email}</p>
                          </div>
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-m3-secondary px-1.5 py-0.5 rounded bg-m3-sidebar border border-m3-border">
                            {t(
                              `settings.roles.${member.role as AppRole}` as "settings.roles.owner",
                            )}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </Surface>

            {!isOrgTarget ? (
              <Surface className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-m3-text">
                    {t("settings.notifications.delivery.title")}
                  </h3>
                  <p className="text-xs text-m3-secondary mt-0.5">
                    {t("settings.notifications.delivery.desc")}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {CHANNELS.map((opt) => {
                    const activeCh = channel === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setChannel(opt.value)}
                        className={`flex flex-col items-start gap-1.5 p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                          activeCh
                            ? "border-m3-primary bg-m3-primary/5"
                            : "border-m3-border hover:border-m3-primary/40"
                        }`}
                      >
                        <span
                          className={`w-8 h-8 rounded-md flex items-center justify-center ${
                            activeCh
                              ? "bg-m3-primary text-white"
                              : "bg-m3-sidebar text-m3-secondary"
                          }`}
                        >
                          {opt.icon}
                        </span>
                        <span
                          className={`text-sm font-medium ${
                            activeCh ? "text-m3-primary" : "text-m3-text"
                          }`}
                        >
                          {t(
                            `settings.notifications.delivery.${opt.value}` as "settings.notifications.delivery.inbox",
                          )}
                        </span>
                        <span className="text-xs text-m3-secondary">
                          {t(
                            `settings.notifications.delivery.${opt.value}Desc` as "settings.notifications.delivery.inboxDesc",
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </Surface>
            ) : null}

            <Surface className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-m3-text">
                  {t("settings.notifications.content.title")}
                </h3>
                <p className="text-xs text-m3-secondary mt-0.5">
                  {t("settings.notifications.content.desc")}
                </p>
              </div>

              {showTypeField ? (
                <div>
                  <label className="text-xs font-medium text-m3-text block mb-2">
                    {t("settings.notifications.content.typeLabel")}
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {TYPE_PRESETS.map((preset) => {
                      const isActive = typePreset === preset.value;
                      return (
                        <button
                          key={preset.value}
                          type="button"
                          onClick={() => setTypePreset(preset.value)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                            isActive
                              ? "bg-m3-primary text-white border-m3-primary"
                              : "bg-m3-card text-m3-secondary border-m3-border hover:border-m3-primary/40"
                          }`}
                        >
                          {preset.icon}
                          {t(
                            `settings.notifications.content.types.${preset.value}` as "settings.notifications.content.types.info",
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              <Input
                label={t("settings.notifications.content.titleLabel")}
                placeholder={t("settings.notifications.content.titlePlaceholder")}
                value={title}
                maxLength={255}
                required
                onChange={(e) => setTitle(e.target.value)}
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-m3-text">
                  {t("settings.notifications.content.descriptionLabel")}
                </label>
                <textarea
                  value={description}
                  maxLength={1000}
                  rows={3}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t("settings.notifications.content.descriptionPlaceholder")}
                  className="w-full rounded-md border border-m3-border bg-m3-card text-m3-text text-sm px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-m3-primary/25 focus:border-m3-primary resize-y"
                />
              </div>

              <Input
                label={t("settings.notifications.content.linkLabel")}
                placeholder={t("settings.notifications.content.linkPlaceholder")}
                helperText={t("settings.notifications.content.linkHint")}
                value={href}
                maxLength={2048}
                icon={<Link2 className="w-4 h-4" />}
                onChange={(e) => setHref(e.target.value)}
              />
            </Surface>
          </div>

          <div className="lg:col-span-2">
            <Surface className="space-y-4 lg:sticky lg:top-4">
              <h3 className="text-sm font-semibold text-m3-text">
                {t("settings.notifications.content.preview")}
              </h3>

              {(isOrgTarget || channel === "inbox" || channel === "both") && (
                <div className="p-3.5 rounded-lg border border-m3-border bg-m3-sidebar/40">
                  <div className="flex gap-3 items-start">
                    <div className="p-2 rounded-md bg-m3-card border border-m3-border text-m3-primary shrink-0">
                      {previewIcon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-m3-text truncate">
                        {title.trim() || t("settings.notifications.content.previewEmpty")}
                      </p>
                      {description.trim() ? (
                        <p className="text-xs text-m3-secondary mt-0.5 leading-relaxed">
                          {description.trim()}
                        </p>
                      ) : null}
                      <span className="text-xs text-m3-secondary mt-1.5 block">
                        {t("settings.notifications.content.now")}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {!isOrgTarget && channel !== "inbox" ? (
                <div className="rounded-lg border border-m3-border bg-m3-text text-m3-card p-3.5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-4 h-4 rounded bg-m3-primary flex items-center justify-center">
                      <Bell className="w-2.5 h-2.5 text-white" />
                    </span>
                    <span className="text-xs opacity-70 truncate">
                      {t("settings.notifications.content.appName")}
                    </span>
                    <span className="text-xs opacity-50 ml-auto">
                      {t("settings.notifications.content.now")}
                    </span>
                  </div>
                  <p className="text-sm font-semibold leading-snug">
                    {title.trim() || t("settings.notifications.content.previewEmpty")}
                  </p>
                  <p className="text-xs opacity-70 mt-0.5 leading-snug">
                    {description.trim() || title.trim()}
                  </p>
                </div>
              ) : null}

              <p className="text-xs text-m3-secondary leading-relaxed">
                {isOrgTarget
                  ? selectedRoles.length > 0
                    ? t("settings.notifications.summaryOrgRoles", {
                        roles: selectedRoles
                          .map((r) => t(`settings.roles.${r}` as "settings.roles.owner"))
                          .join(", "),
                      })
                    : t("settings.notifications.summaryOrg")
                  : t("settings.notifications.summaryUser", {
                      name: recipient?.name ?? "—",
                    })}
              </p>

              <Button
                variant="primary"
                type="submit"
                size="md"
                isLoading={isSending}
                disabled={!canSubmit}
                icon={<Send className="w-4 h-4" />}
                className="w-full"
              >
                {isSending ? t("settings.notifications.sending") : t("settings.notifications.send")}
              </Button>
            </Surface>
          </div>
        </div>
      </form>
    </AccountCenter>
  );
}
