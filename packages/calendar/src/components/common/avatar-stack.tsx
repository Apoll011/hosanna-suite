import React from "react";
import type { Assignee } from "../../interfaces";
import { getAvatarGradient, getInitials } from "../../utils/icon-map";

interface AvatarStackProps {
  assignees: Assignee[];
  max?: number;
  size?: "sm" | "md";
}

export const AvatarStack: React.FC<AvatarStackProps> = ({ assignees, max = 4, size = "sm" }) => {
  const dim = size === "sm" ? "w-7 h-7 text-[10px]" : "w-9 h-9 text-xs";
  const visible = assignees.slice(0, max);
  const overflow = assignees.length - visible.length;

  if (assignees.length === 0) {
    return <span className="text-[11px] font-semibold text-m3-secondary italic">Unassigned</span>;
  }

  if (assignees.length === 1) {
    const a = assignees[0];
    return (
      <div className="flex items-center gap-2">
        <div
          title={a.name}
          className={`${dim} rounded-full ring-2 ${
            a.memberId ? "ring-green-600" : "ring-gray-400"
          } dark:ring-slate-900 flex items-center justify-center font-extrabold text-white shrink-0 bg-gradient-to-tr ${getAvatarGradient(
            a.name,
          )}`}
        >
          {a.avatarUrl ? (
            <img
              src={a.avatarUrl}
              alt={a.name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            getInitials(a.name)
          )}
        </div>
        <span className="text-xs font-bold text-m3-text truncate min-w-0">{a.name}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center -space-x-2">
      {visible.map((a, idx) => (
        <div
          key={a.id ?? idx}
          title={a.name}
          className={`${dim} rounded-full ring-2 ${
            a.memberId ? "ring-green-600" : "ring-gray-400"
          } dark:ring-slate-900 flex items-center justify-center font-extrabold text-white shrink-0 bg-gradient-to-tr ${getAvatarGradient(
            a.name,
          )}`}
        >
          {a.avatarUrl ? (
            <img
              src={a.avatarUrl}
              alt={a.name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            getInitials(a.name)
          )}
        </div>
      ))}
      {overflow > 0 && (
        <div
          className={`${dim} rounded-full ring-2 ring-white dark:ring-slate-900 flex items-center justify-center font-extrabold text-slate-500 bg-slate-100 dark:bg-slate-800 shrink-0`}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
};
