import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";
import { sharedUiT, type Language } from "./sharedT";
import { usePresence } from "./usePresence";

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
  language?: Language;
  children: ReactNode;
}

export function WorkspaceSidebar({
  open,
  collapsed,
  onDismiss,
  language,
  className,
  children,
  ...props
}: WorkspaceSidebarProps) {
  const mounted = usePresence(open, 240);
  const t = sharedUiT(language);
  return (
    <>
      {mounted && (
        <button
          type="button"
          aria-label={t("common.closeNavigation")}
          onClick={onDismiss}
          className={cn(
            "fixed inset-0 z-40 bg-m3-text/40 backdrop-blur-sm transition-opacity duration-200 md:hidden",
            open ? "opacity-100" : "pointer-events-none opacity-0",
          )}
        />
      )}
      <aside
        {...props}
        data-state={open ? "open" : "closed"}
        data-collapsed={collapsed || undefined}
        className={cn(
          "w-72 shrink-0 select-none flex-col gap-1 border-r border-m3-border p-4 transition-[width] duration-[320ms] [transition-timing-function:cubic-bezier(.2,.8,.2,1)]",
          "absolute inset-y-0 left-0 z-50 flex bg-m3-sidebar shadow-lg transition-[transform,opacity,width] duration-[320ms] [transition-timing-function:cubic-bezier(.2,.8,.2,1)] md:relative md:z-30 md:translate-x-0 md:opacity-100 md:pointer-events-auto md:bg-m3-sidebar/30 md:shadow-none",
          open ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0 pointer-events-none",
          collapsed ? "md:w-20" : "md:w-64",
          className,
        )}
      >
        {children}
      </aside>
    </>
  );
}

interface WorkspaceNavItemProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  icon: ReactNode;
  label: ReactNode;
  active?: boolean;
  collapsed?: boolean;
  badge?: ReactNode;
}

export function WorkspaceNavItem({
  icon,
  label,
  active = false,
  collapsed = false,
  badge,
  className,
  title,
  ...props
}: WorkspaceNavItemProps) {
  return (
    <button
      {...props}
      type={props.type ?? "button"}
      title={title ?? (collapsed ? String(label) : undefined)}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex min-h-10 w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-[13px] font-medium transition-[background-color,color,transform] duration-150 active:scale-[.99]",
        active ? "bg-m3-primary/10 text-m3-primary" : "text-m3-secondary hover:bg-m3-hover hover:text-m3-text",
        className,
      )}
    >
      <span className="flex min-w-0 flex-1 items-center gap-3">
        <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center", active ? "text-m3-primary" : "text-m3-secondary group-hover:text-m3-text")}>
          {icon}
        </span>
        <span
          className={cn(
            "truncate overflow-hidden whitespace-nowrap transition-[opacity,max-width,transform] duration-300 [transition-timing-function:cubic-bezier(.2,.8,.2,1)]",
            collapsed ? "pointer-events-none max-w-0 -translate-x-2 opacity-0" : "max-w-35 translate-x-0 opacity-100",
          )}
        >
          {label}
        </span>
      </span>
      {badge != null && (
        <span
          className={cn(
            "shrink-0 overflow-hidden transition-[opacity,max-width] duration-300 [transition-timing-function:cubic-bezier(.2,.8,.2,1)]",
            collapsed ? "pointer-events-none max-w-0 opacity-0" : "max-w-15 opacity-100",
          )}
        >
          {badge}
        </span>
      )}
    </button>
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
