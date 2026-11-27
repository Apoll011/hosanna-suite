// SPDX-License-Identifier: AGPL-3.0-only
import { useCalendar } from "../../contexts/calendar-context";

import { AvatarGroup } from "../../ui/avatar-group";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { SpringDropdown, type SpringDropdownOption } from "@hosanna/ui";
import { useMemo } from "react";

export function UserSelect() {
  const { users, selectedUserId, setSelectedUserId } = useCalendar();
  const options = useMemo<SpringDropdownOption<string>[]>(
    () => [
      {
        id: "all",
        label: "All people",
        icon: (
          <AvatarGroup max={2}>
            {users.map((user) => (
              <Avatar key={user.id} className="size-5 text-[0.625rem]">
                <AvatarImage src={user.avatarUrl ?? user.picturePath ?? undefined} alt={user.name} />
                <AvatarFallback className="text-[0.625rem]">{user.name[0] ?? "?"}</AvatarFallback>
              </Avatar>
            ))}
          </AvatarGroup>
        ),
      },
      ...users.map((user) => ({
        id: user.id,
        label: user.name,
        icon: (
          <Avatar className="size-5">
            <AvatarImage src={user.avatarUrl ?? user.picturePath ?? undefined} alt={user.name} />
            <AvatarFallback className="text-[0.625rem]">{user.name[0] ?? "?"}</AvatarFallback>
          </Avatar>
        ),
      })),
    ],
    [users],
  );

  if (!users || users.length === 0) return null;

  return (
    <SpringDropdown
      mode="single"
      options={options}
      selected={selectedUserId}
      onChange={setSelectedUserId}
      ariaLabel="Filter calendar by assignee"
      className="h-9 flex-1 md:w-48"
    />
  );
}
