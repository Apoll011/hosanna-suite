// SPDX-License-Identifier: AGPL-3.0-only
import { useCalendar } from "../../contexts/calendar-context";

import { AvatarGroup } from "../../ui/avatar-group";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";

export function UserSelect() {
  const { users, selectedUserId, setSelectedUserId } = useCalendar();

  if (!users || users.length === 0) return null;

  return (
    <Select value={selectedUserId} onValueChange={setSelectedUserId}>
      <SelectTrigger className="flex-1 md:w-48">
        <SelectValue placeholder="All assignees" />
      </SelectTrigger>

      <SelectContent align="end">
        <SelectItem value="all">
          <div className="flex items-center gap-1.5">
            <AvatarGroup max={2}>
              {users.map((user) => {
                const avatar = user.avatarUrl ?? user.picturePath ?? undefined;
                return (
                  <Avatar key={user.id} className="size-5 text-[0.625rem]">
                    <AvatarImage src={avatar} alt={user.name} />
                    <AvatarFallback className="text-[0.625rem]">
                      {user.name[0] ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                );
              })}
            </AvatarGroup>
            <span>All people</span>
          </div>
        </SelectItem>

        {users.map((user) => {
          const avatar = user.avatarUrl ?? user.picturePath ?? undefined;
          return (
            <SelectItem key={user.id} value={user.id} className="flex-1">
              <div className="flex items-center gap-2">
                <Avatar className="size-5">
                  <AvatarImage src={avatar} alt={user.name} />
                  <AvatarFallback className="text-[0.625rem]">{user.name[0] ?? "?"}</AvatarFallback>
                </Avatar>

                <p className="truncate text-xs">{user.name}</p>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
