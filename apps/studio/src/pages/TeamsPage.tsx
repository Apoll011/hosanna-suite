/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button, Input, Modal, PageHeader } from "@/src/components/common";
import { useI18n } from "@/src/lib/i18n";
import {
  ArrowLeft,
  Calendar,
  Crown,
  Music,
  Plus,
  Search,
  Shield,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useSync } from "../contexts/SyncContext";

export interface TeamMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: "leader" | "member";
  joinedAt: Date;
}

export interface Team {
  id: string;
  name: string;
  slug: string;
  description?: string;
  leaderId?: string;
  leaderName?: string;
  membersCount: number;
  permissions?: {
    canManageSongs: boolean;
    canManageServices: boolean;
    canInviteMembers: boolean;
  };
  createdAt: Date;
}

export const TeamsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useSync();
  const { t } = useI18n();

  const [teams, setTeams] = useState<Team[]>([
    {
      id: "team-1",
      name: "Equipa de Louvor Principal",
      slug: "louvor-principal",
      description: "Músicos e vocais responsáveis pelos cultos de Domingo.",
      leaderId: "user-1",
      leaderName: "Tiago Bernardo",
      membersCount: 8,
      permissions: {
        canManageSongs: true,
        canManageServices: true,
        canInviteMembers: true,
      },
      createdAt: new Date(),
    },
    {
      id: "team-2",
      name: "Técnicos de Som e Multimédia",
      slug: "som-multimedia",
      description:
        "Equipa responsável por som, projeção e transmissão ao vivo.",
      leaderId: "user-2",
      leaderName: "Carlos Silva",
      membersCount: 4,
      permissions: {
        canManageSongs: false,
        canManageServices: true,
        canInviteMembers: false,
      },
      createdAt: new Date(),
    },
  ]);

  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<Record<string, TeamMember[]>>({
    "team-1": [
      {
        id: "tm-1",
        userId: "user-1",
        name: user?.name || "Tiago Bernardo",
        email: user?.email || "tiago@example.com",
        role: "leader",
        joinedAt: new Date(),
      },
      {
        id: "tm-2",
        userId: "user-3",
        name: "Ana Oliveira",
        email: "ana@example.com",
        role: "member",
        joinedAt: new Date(),
      },
      {
        id: "tm-3",
        userId: "user-4",
        name: "João Santos",
        email: "joao@example.com",
        role: "member",
        joinedAt: new Date(),
      },
    ],
    "team-2": [
      {
        id: "tm-4",
        userId: "user-2",
        name: "Carlos Silva",
        email: "carlos@example.com",
        role: "leader",
        joinedAt: new Date(),
      },
    ],
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);

  // Form states
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDesc, setNewTeamDesc] = useState("");
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<"leader" | "member">(
    "member",
  );

  // User role check
  const userRole = (user as { role?: string })?.role || "admin";
  const isOrgAdminOrOwner = ["owner", "admin"].includes(userRole);

  const filteredTeams = teams.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.slug.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    const slug = newTeamName.toLowerCase().replace(/\s+/g, "-");
    const newTeam: Team = {
      id: `team-${Date.now()}`,
      name: newTeamName.trim(),
      slug,
      description: newTeamDesc.trim(),
      membersCount: 1,
      leaderId: user?.id,
      leaderName: user?.name,
      permissions: {
        canManageSongs: true,
        canManageServices: true,
        canInviteMembers: true,
      },
      createdAt: new Date(),
    };

    setTeams((prev) => [newTeam, ...prev]);
    setTeamMembers((prev) => ({
      ...prev,
      [newTeam.id]: [
        {
          id: `tm-${Date.now()}`,
          userId: user?.id || "user-1",
          name: user?.name || t("common.you"),
          email: user?.email || "admin@example.com",
          role: "leader",
          joinedAt: new Date(),
        },
      ],
    }));

    setNewTeamName("");
    setNewTeamDesc("");
    setIsCreateModalOpen(false);
    showToast(t("teamsPage.teamCreated"), "success");
  };

  const handleDeleteTeam = (teamId: string) => {
    setTeams((prev) => prev.filter((t) => t.id !== teamId));
    if (selectedTeam?.id === teamId) {
      setSelectedTeam(null);
    }
    showToast(t("teamsPage.teamRemoved"), "success");
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam || !newMemberName.trim() || !newMemberEmail.trim())
      return;

    const newMember: TeamMember = {
      id: `tm-${Date.now()}`,
      userId: `user-${Date.now()}`,
      name: newMemberName.trim(),
      email: newMemberEmail.trim(),
      role: newMemberRole,
      joinedAt: new Date(),
    };

    setTeamMembers((prev) => ({
      ...prev,
      [selectedTeam.id]: [...(prev[selectedTeam.id] || []), newMember],
    }));

    setTeams((prev) =>
      prev.map((t) =>
        t.id === selectedTeam.id
          ? {
              ...t,
              membersCount: t.membersCount + 1,
              ...(newMemberRole === "leader"
                ? { leaderId: newMember.userId, leaderName: newMember.name }
                : {}),
            }
          : t,
      ),
    );

    if (newMemberRole === "leader" && selectedTeam) {
      setSelectedTeam((prev) =>
        prev
          ? { ...prev, leaderId: newMember.userId, leaderName: newMember.name }
          : null,
      );
    }

    setNewMemberName("");
    setNewMemberEmail("");
    setIsAddMemberModalOpen(false);
    showToast(t("teamsPage.memberAdded"), "success");
  };

  const handleRemoveMember = (teamId: string, memberId: string) => {
    setTeamMembers((prev) => ({
      ...prev,
      [teamId]: prev[teamId].filter((m) => m.id !== memberId),
    }));

    setTeams((prev) =>
      prev.map((t) =>
        t.id === teamId
          ? { ...t, membersCount: Math.max(1, t.membersCount - 1) }
          : t,
      ),
    );

    showToast(t("teamsPage.memberRemoved"), "success");
  };

  const handleAssignLeader = (teamId: string, member: TeamMember) => {
    setTeamMembers((prev) => ({
      ...prev,
      [teamId]: prev[teamId].map((m) => ({
        ...m,
        role: m.id === member.id ? "leader" : "member",
      })),
    }));

    setTeams((prev) =>
      prev.map((t) =>
        t.id === teamId
          ? { ...t, leaderId: member.userId, leaderName: member.name }
          : t,
      ),
    );

    if (selectedTeam?.id === teamId) {
      setSelectedTeam((prev) =>
        prev
          ? { ...prev, leaderId: member.userId, leaderName: member.name }
          : null,
      );
    }

    showToast(t("teamsPage.leaderAssigned", { name: member.name }), "success");
  };

  const handleTogglePermission = (
    permKey: keyof NonNullable<Team["permissions"]>,
  ) => {
    if (!selectedTeam) return;

    const currentPerms = selectedTeam.permissions || {
      canManageSongs: true,
      canManageServices: true,
      canInviteMembers: true,
    };

    const updated = {
      ...currentPerms,
      [permKey]: !currentPerms[permKey],
    };

    setSelectedTeam({
      ...selectedTeam,
      permissions: updated,
    });

    setTeams((prev) =>
      prev.map((t) =>
        t.id === selectedTeam.id ? { ...t, permissions: updated } : t,
      ),
    );

    showToast(t("teamsPage.permissionsUpdated"), "success");
  };

  // If viewing single team detail page (TEAM-05)
  if (selectedTeam) {
    const members = teamMembers[selectedTeam.id] || [];
    const isLeaderOfTeam =
      selectedTeam.leaderId === user?.id || isOrgAdminOrOwner;

    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
        {/* Back navigation header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedTeam(null)}
            className="inline-flex items-center text-sm font-bold text-m3-secondary hover:text-m3-text transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("teamsPage.backToTeams")}
          </button>

          <div className="flex items-center gap-2">
            <span className="text-caption bg-m3-sidebar text-m3-secondary border border-m3-border px-2.5 py-1 rounded-[var(--radius-md)] flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" />
              {isLeaderOfTeam
                ? t("teamsPage.teamManagerBadge")
                : t("teamsPage.memberBadge")}
            </span>
          </div>
        </div>

        <div className="bg-m3-card border border-m3-border rounded-[var(--radius-xl)] p-6 sm:p-8 shadow-[var(--shadow-sm)]">
          <span className="text-label text-m3-secondary bg-m3-sidebar px-2.5 py-1 rounded-[var(--radius-md)]">
            {selectedTeam.slug}
          </span>
          <h1 className="text-display text-m3-text mt-3 mb-1">
            {selectedTeam.name}
          </h1>
          <p className="text-muted max-w-xl">
            {selectedTeam.description || t("teamsPage.noDesc")}
          </p>

          <div className="flex flex-wrap gap-3 mt-5 text-caption">
            <div className="flex items-center gap-1.5 bg-m3-sidebar border border-m3-border px-3 py-1.5 rounded-[var(--radius-md)]">
              <Crown className="w-4 h-4 text-amber-500" />
              <span>
                {t("teamsPage.leaderLabel", {
                  name: selectedTeam.leaderName || t("teamsPage.notAssigned"),
                })}
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-m3-sidebar border border-m3-border px-3 py-1.5 rounded-[var(--radius-md)]">
              <Users className="w-4 h-4 text-m3-primary" />
              <span>
                {t("teamsPage.membersCount", { count: members.length })}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Members List (TEAM-03 & TEAM-04) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-title text-m3-text flex items-center gap-2">
                <Users className="w-5 h-5 text-m3-primary" />
                {t("teamsPage.teamMembersTitle")}
              </h2>

              {isLeaderOfTeam && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsAddMemberModalOpen(true)}
                  icon={<UserPlus className="w-4 h-4" />}
                >
                  {t("teamsPage.addMember")}
                </Button>
              )}
            </div>

            <div className="bg-m3-card border border-m3-border rounded-[var(--radius-xl)] divide-y divide-m3-border/60 overflow-hidden shadow-[var(--shadow-sm)]">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="p-4 flex items-center justify-between hover:bg-m3-hover transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-m3-sidebar flex items-center justify-center font-bold text-m3-text text-sm">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-m3-text text-sm">
                          {member.name}
                        </span>
                        {member.role === "leader" && (
                          <span className="text-label bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Crown className="w-3 h-3" />
                            {t("settings.roles.teamLeader")}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-m3-secondary">
                        {member.email}
                      </p>
                    </div>
                  </div>

                  {isLeaderOfTeam && (
                    <div className="flex items-center gap-2">
                      {member.role !== "leader" && isOrgAdminOrOwner && (
                        <button
                          onClick={() =>
                            handleAssignLeader(selectedTeam.id, member)
                          }
                          title={t("teamsPage.setLeaderTitle")}
                          className="px-2.5 py-1 text-xs font-bold text-amber-600 hover:bg-amber-50 rounded-lg transition-colors border border-amber-200 flex items-center gap-1 cursor-pointer"
                        >
                          <Crown className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">
                            {t("teamsPage.setLeader")}
                          </span>
                        </button>
                      )}

                      {member.userId !== user?.id && (
                        <button
                          onClick={() =>
                            handleRemoveMember(selectedTeam.id, member.id)
                          }
                          title={t("teamsPage.removeFromTeamTitle")}
                          className="p-1.5 text-m3-secondary hover:text-m3-danger rounded-lg hover:bg-m3-danger/10 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Team Permissions & Settings (TEAM-05) */}
          <div className="space-y-4">
            <h2 className="text-title text-m3-text flex items-center gap-2">
              <Shield className="w-5 h-5 text-m3-primary" />
              {t("teamsPage.teamPermissionsTitle")}
            </h2>

            <div className="bg-m3-card border border-m3-border rounded-[var(--radius-xl)] p-5 space-y-4 shadow-[var(--shadow-sm)]">
              <p className="text-xs text-m3-secondary leading-relaxed">
                {t("teamsPage.teamPermissionsDesc")}
              </p>

              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 rounded-xl bg-m3-sidebar border border-m3-border/60 cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <Music className="w-4 h-4 text-m3-primary" />
                    <div>
                      <p className="text-xs font-bold text-m3-text">
                        {t("teamsPage.manageSongs")}
                      </p>
                      <p className="text-[10px] text-m3-secondary">
                        {t("teamsPage.manageSongsDesc")}
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedTeam.permissions?.canManageSongs ?? true}
                    onChange={() => handleTogglePermission("canManageSongs")}
                    disabled={!isLeaderOfTeam}
                    className="w-4 h-4 accent-m3-primary rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-m3-sidebar border border-m3-border/60 cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <Calendar className="w-4 h-4 text-emerald-500" />
                    <div>
                      <p className="text-xs font-bold text-m3-text">
                        {t("teamsPage.manageServices")}
                      </p>
                      <p className="text-[10px] text-m3-secondary">
                        {t("teamsPage.manageServicesDesc")}
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={
                      selectedTeam.permissions?.canManageServices ?? true
                    }
                    onChange={() => handleTogglePermission("canManageServices")}
                    disabled={!isLeaderOfTeam}
                    className="w-4 h-4 accent-m3-primary rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-m3-sidebar border border-m3-border/60 cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <UserPlus className="w-4 h-4 text-amber-500" />
                    <div>
                      <p className="text-xs font-bold text-m3-text">
                        {t("teamsPage.inviteMembers")}
                      </p>
                      <p className="text-[10px] text-m3-secondary">
                        {t("teamsPage.inviteMembersDesc")}
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedTeam.permissions?.canInviteMembers ?? true}
                    onChange={() => handleTogglePermission("canInviteMembers")}
                    disabled={!isLeaderOfTeam}
                    className="w-4 h-4 accent-m3-primary rounded cursor-pointer"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Modal: Add Member */}
        {isAddMemberModalOpen && (
          <Modal
            isOpen={isAddMemberModalOpen}
            onClose={() => setIsAddMemberModalOpen(false)}
            title={t("teamsPage.addMemberModalTitle")}
          >
            <form onSubmit={handleAddMember} className="space-y-4 pt-2">
              <Input
                label={t("teamsPage.memberNameLabel")}
                placeholder={t("teamsPage.memberNamePlaceholder")}
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                required
              />
              <Input
                type="email"
                label={t("teamsPage.memberEmailLabel")}
                placeholder={t("teamsPage.memberEmailPlaceholder")}
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                required
              />

              <div>
                <label className="block text-xs font-bold text-m3-text mb-1">
                  {t("teamsPage.teamRoleLabel")}
                </label>
                <select
                  value={newMemberRole}
                  onChange={(e) =>
                    setNewMemberRole(e.target.value as "leader" | "member")
                  }
                  className="w-full h-11 px-3 bg-m3-sidebar border border-m3-border rounded-xl text-sm font-semibold"
                >
                  <option value="member">{t("settings.roles.member")}</option>
                  {isOrgAdminOrOwner && (
                    <option value="leader">
                      {t("settings.roles.teamLeader")}
                    </option>
                  )}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setIsAddMemberModalOpen(false)}
                >
                  {t("common.cancel")}
                </Button>
                <Button variant="primary" type="submit">
                  {t("teamsPage.addMemberBtn")}
                </Button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title={t("teamsPage.title")}
        description={t("teamsPage.desc")}
        actions={
          isOrgAdminOrOwner ? (
            <Button
              variant="primary"
              onClick={() => setIsCreateModalOpen(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              {t("teamsPage.newTeam")}
            </Button>
          ) : undefined
        }
      />

      {/* Search & Stats */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-m3-card p-4 border border-m3-border rounded-[var(--radius-xl)] shadow-[var(--shadow-sm)]">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-m3-secondary absolute left-3 top-3.5" />
          <input
            type="text"
            placeholder={t("teamsPage.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-m3-sidebar border border-m3-border rounded-xl text-xs font-semibold focus:outline-none focus:border-m3-primary"
          />
        </div>

        <div className="flex items-center gap-4 text-xs font-bold text-m3-secondary">
          <span>{t("teamsPage.totalTeams", { count: teams.length })}</span>
        </div>
      </div>

      {/* Teams Grid (TEAM-01) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTeams.map((team) => (
          <div
            key={team.id}
            onClick={() => setSelectedTeam(team)}
            className="bg-m3-card border border-m3-border rounded-[var(--radius-xl)] p-5 hover:border-m3-primary/50 hover:shadow-[var(--shadow-md)] transition-colors cursor-pointer group flex flex-col justify-between relative"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="w-10 h-10 rounded-xl bg-m3-primary/10 text-m3-primary flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>

                <span className="text-label text-m3-secondary bg-m3-sidebar px-2 py-1 rounded-md">
                  {team.slug}
                </span>
              </div>

              <h3 className="font-bold text-m3-text text-base group-hover:text-m3-primary transition-colors">
                {team.name}
              </h3>

              <p className="text-xs text-m3-secondary mt-1 line-clamp-2 leading-relaxed">
                {team.description || t("teamsPage.noDesc")}
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-m3-border/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-m3-secondary font-semibold">
                <Crown className="w-3.5 h-3.5 text-amber-500" />
                <span className="truncate max-w-30">
                  {team.leaderName || t("teamsPage.noLeader")}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-bold text-m3-primary bg-m3-primary/10 px-2 py-0.5 rounded-md">
                  {t("teamsPage.membersCount", { count: team.membersCount })}
                </span>

                {isOrgAdminOrOwner && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTeam(team.id);
                    }}
                    title={t("teamsPage.removeTeamTitle")}
                    className="p-1 text-m3-secondary hover:text-m3-danger rounded transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Create Team (TEAM-02) */}
      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title={t("teamsPage.createModalTitle")}
        >
          <form onSubmit={handleCreateTeam} className="space-y-4 pt-2">
            <Input
              label={t("teamsPage.teamNameLabel")}
              placeholder={t("teamsPage.teamNamePlaceholder")}
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              required
            />

            <div>
              <label className="block text-xs font-bold text-m3-text mb-1">
                {t("teamsPage.descLabel")}
              </label>
              <textarea
                placeholder={t("teamsPage.descPlaceholder")}
                value={newTeamDesc}
                onChange={(e) => setNewTeamDesc(e.target.value)}
                className="w-full h-20 p-3 bg-m3-sidebar border border-m3-border rounded-xl text-xs font-medium focus:outline-none focus:border-m3-primary resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
              >
                {t("common.cancel")}
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={!newTeamName.trim()}
              >
                {t("teamsPage.createBtn")}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
