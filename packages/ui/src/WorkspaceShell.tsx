import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

type WorkspaceFrameProps = HTMLAttributes<HTMLDivElement>;

export function WorkspaceFrame({ className, ...props }: WorkspaceFrameProps) {
  return (
    <div
      {...props}
      className={cn("flex h-dvh max-h-dvh w-full flex-row overflow-hidden bg-m3-bg", className)}
    />
  );
}

interface WorkspaceSidebarProps extends HTMLAttributes<HTMLElement> {
  open: boolean;
  collapsed: boolean;
  onDismiss: () => void;
  children: ReactNode;
}

export function WorkspaceSidebar({
  open,
  collapsed,
  onDismiss,
  className,
  children,
  ...props
}: WorkspaceSidebarProps) {
  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onDismiss}
          className="fixed inset-0 z-40 bg-m3-text/40 backdrop-blur-sm md:hidden"
        />
      )}
      <aside
        {...props}
        data-state={open ? "open" : "closed"}
        data-collapsed={collapsed || undefined}
        className={cn(
          "w-72 shrink-0 select-none flex-col gap-1 border-r border-m3-border p-4 transition-[width] duration-[320ms] [transition-timing-function:cubic-bezier(.2,.8,.2,1)]",
          open ? "absolute inset-y-0 left-0 z-50 flex bg-m3-sidebar shadow-lg" : "hidden",
          "md:relative md:z-30 md:flex md:bg-m3-sidebar/30",
          collapsed ? "md:w-20" : "md:w-64",
          className,
        )}
      >
        {children}
      </aside>
    </>
  );
}

type WorkspaceMainProps = HTMLAttributes<HTMLDivElement>;

export function WorkspaceMain({ className, ...props }: WorkspaceMainProps) {
  return (
    <div
      {...props}
      className={cn("flex h-full min-w-0 flex-1 flex-col overflow-hidden p-2 sm:p-4 md:p-0", className)}
    />
  );
}

type WorkspaceSurfaceProps = HTMLAttributes<HTMLElement>;

export function WorkspaceSurface({ className, ...props }: WorkspaceSurfaceProps) {
  return (
    <section
      {...props}
      className={cn(
        "flex h-full flex-1 flex-col overflow-hidden rounded-xl border border-m3-border bg-m3-card shadow-lg transition-colors duration-300 md:rounded-none md:border-none md:shadow-none",
        className,
      )}
    />
  );
}

type WorkspaceHeaderProps = HTMLAttributes<HTMLElement>;

export function WorkspaceHeader({ className, ...props }: WorkspaceHeaderProps) {
  return (
    <header
      {...props}
      className={cn(
        "relative flex flex-col items-center justify-between gap-3 border-b border-m3-border/50 bg-m3-sidebar/40 p-3 sm:gap-4 sm:p-4 md:flex-row",
        className,
      )}
    />
  );
}
