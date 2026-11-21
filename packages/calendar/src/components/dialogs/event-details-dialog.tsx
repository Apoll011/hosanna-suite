"use client";

import { format } from "date-fns";
import { Calendar, Clock, Text, User } from "lucide-react";

import { Button } from "../../ui/button";
import { EditEventDialog } from "./edit-event-dialog";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../../ui/dialog";
import { getEventStart, getEventEnd } from "../../helpers";

import type { AgendaEvent } from "../../interfaces";

interface IProps {
  event: AgendaEvent;
  children: React.ReactNode;
}

export function EventDetailsDialog({ event, children }: IProps) {
  const startDate = getEventStart(event);
  const endDate = getEventEnd(event);

  const userName = event.user?.name || (event.responsibilities?.[0]?.assignees?.[0]?.name ?? "No assignee");

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{event.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-start gap-2">
            <User className="mt-1 size-4 shrink-0" />
            <div>
              <p className="text-sm font-medium">Responsible</p>
              <p className="text-sm text-m3-secondary">{userName}</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Calendar className="mt-1 size-4 shrink-0" />
            <div>
              <p className="text-sm font-medium">Start Date</p>
              <p className="text-sm text-m3-secondary">{format(startDate, "MMM d, yyyy h:mm a")}</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Clock className="mt-1 size-4 shrink-0" />
            <div>
              <p className="text-sm font-medium">End Date</p>
              <p className="text-sm text-m3-secondary">{format(endDate, "MMM d, yyyy h:mm a")}</p>
            </div>
          </div>

          {(event.notes || event.description) && (
            <div className="flex items-start gap-2">
              <Text className="mt-1 size-4 shrink-0" />
              <div>
                <p className="text-sm font-medium">Description</p>
                <p className="text-sm text-m3-secondary">{event.notes || event.description}</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <EditEventDialog event={event}>
            <Button type="button" variant="outline">
              Edit
            </Button>
          </EditEventDialog>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
