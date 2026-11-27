import type { ReactNode } from "react";

export type NotificationChatBoxProps = {
  title: string;
  children: ReactNode;
  compact?: boolean;
  className?: string;
};

export function NotificationChatBox({
  title,
  children,
  compact = false,
  className = "",
}: NotificationChatBoxProps) {
  if (compact) {
    return (
      <section className={`flex h-full min-w-0 items-center gap-2 ${className}`}>
        <span className="h-2 w-2 shrink-0 rounded-full bg-m3-primary" aria-hidden />
        <h2 className="truncate text-sm font-medium text-m3-text">{title}</h2>
        {children}
      </section>
    );
  }

  return (
    <section className={`flex h-full min-h-0 flex-col ${className}`}>
      <h2 className="mb-2.5 text-sm font-semibold text-m3-text">{title}</h2>
      {children}
    </section>
  );
}
