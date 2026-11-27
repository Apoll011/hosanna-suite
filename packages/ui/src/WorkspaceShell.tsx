import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { ChevronLeft, ChevronRight, CornerLeftUp, Menu, Search, X } from "lucide-react";
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
  appName: string;
  logo: ReactNode;
  logoAlt: string;
  open: boolean;
  collapsed: boolean;
  onDismiss: () => void;
  onToggleCollapse: () => void;
  collapseLabel: string;
  expandLabel: string;
  navigationLabel: string;
  navItems: WorkspaceSidebarItem[];
  headerContent?: ReactNode;
  content?: ReactNode;
  footerContent?: ReactNode;
  language?: Language;
}

export interface WorkspaceSidebarItem {
  id: string;
  label: ReactNode;
  icon: ReactNode;
  active: boolean;
  onSelect: () => void;
  badge?: ReactNode;
  title?: string;
  tourId?: string;
}

export function WorkspaceSidebar({
  appName,
  logo,
  logoAlt,
  open,
  collapsed,
  onDismiss,
  onToggleCollapse,
  collapseLabel,
  expandLabel,
  navigationLabel,
  navItems,
  headerContent,
  content,
  footerContent,
  language,
  className,
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
        <header className="mb-4 mt-2 flex min-w-0 items-center gap-3 select-none">
          <button
            type="button"
            onClick={onToggleCollapse}
            disabled={!collapsed}
            title={collapsed ? expandLabel : undefined}
            aria-label={collapsed ? expandLabel : undefined}
            className={cn(
              "group relative flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-m3-border/50 bg-m3-card text-m3-secondary shadow-sm transition-colors",
              collapsed && "cursor-pointer hover:bg-m3-hover hover:text-m3-text",
            )}
          >
            <span role="img" aria-label={logoAlt} className="h-10 w-10 transition-opacity group-hover:opacity-90">{logo}</span>
            {collapsed && <span className="pointer-events-none absolute inset-0 grid place-items-center bg-m3-card/80 opacity-0 transition-opacity group-hover:opacity-100"><ChevronRight className="h-5 w-5" aria-hidden="true" /></span>}
          </button>
          <div className={cn("flex min-w-0 flex-1 items-center justify-between gap-1 overflow-hidden whitespace-nowrap transition-[opacity,max-width,transform] duration-300 [transition-timing-function:cubic-bezier(.2,.8,.2,1)]", collapsed ? "pointer-events-none max-w-0 -translate-x-2 opacity-0" : "max-w-60 translate-x-0 opacity-100")}>
            <div className="flex min-w-0 flex-1 flex-col items-start">
              <h1 className="truncate font-display text-title font-semibold leading-none text-m3-text">{appName}</h1>
              {headerContent}
            </div>
            <button
              type="button"
              onClick={onToggleCollapse}
              className="hidden min-h-10 min-w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg text-m3-secondary transition-colors hover:bg-m3-hover hover:text-m3-text md:flex"
              title={collapseLabel}
              aria-label={collapseLabel}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </header>
        <nav aria-label={navigationLabel} className="flex min-h-0 flex-1 flex-col gap-1">
          {navItems.map((item) => (
            <WorkspaceNavItem
              key={item.id}
              data-tour={item.tourId}
              icon={item.icon}
              label={item.label}
              active={item.active}
              collapsed={collapsed}
              badge={item.badge}
              title={item.title}
              onClick={item.onSelect}
            />
          ))}
          {content}
        </nav>
        {footerContent}
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

export interface WorkspaceBreadcrumbItem {
  id: string;
  label: ReactNode;
  icon?: ReactNode;
  onSelect?: () => void;
  current?: boolean;
}

export interface WorkspaceAddressSearch {
  value: string;
  placeholder: string;
  label: string;
  clearLabel: string;
  onChange: (value: string) => void;
  tourId?: string;
}

export interface WorkspaceAddressBarProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  breadcrumbs: WorkspaceBreadcrumbItem[];
  breadcrumbLabel: string;
  mobileMenuLabel: string;
  onToggleSidebar: () => void;
  backLabel: string;
  backDisabled?: boolean;
  onBack: () => void;
  search?: WorkspaceAddressSearch;
  context?: ReactNode;
  actions?: ReactNode;
}

export function WorkspaceAddressBar({
  breadcrumbs,
  breadcrumbLabel,
  mobileMenuLabel,
  onToggleSidebar,
  backLabel,
  backDisabled = false,
  onBack,
  search,
  context,
  actions,
  className,
  ...props
}: WorkspaceAddressBarProps) {
  return (
    <WorkspaceHeader className={cn("gap-3", className)} {...props}>
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-m3-primary/30 text-m3-primary transition-colors hover:bg-m3-primary/10 md:hidden"
          aria-label={mobileMenuLabel}
        >
          <Menu className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onBack}
          disabled={backDisabled}
          title={backLabel}
          aria-label={backLabel}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-m3-border bg-m3-card text-m3-primary transition-colors hover:bg-m3-hover disabled:cursor-default disabled:opacity-40"
        >
          <CornerLeftUp className="h-4 w-4" aria-hidden="true" />
        </button>
        <nav aria-label={breadcrumbLabel} className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto rounded-lg border border-m3-border bg-m3-bg px-4 py-2.5 text-[13px] shadow-sm hide-scrollbar">
          {breadcrumbs.map((item, index) => (
            <span key={item.id} className="flex shrink-0 items-center gap-2">
              {index > 0 && <ChevronRight className="h-3.5 w-3.5 text-m3-secondary/40" aria-hidden="true" />}
              {item.current || !item.onSelect ? (
                <span aria-current={item.current ? "page" : undefined} className={cn("flex items-center gap-2", item.current ? "font-semibold text-m3-primary" : "font-medium text-m3-secondary")}>
                  {item.icon}
                  {item.label}
                </span>
              ) : (
                <button type="button" onClick={item.onSelect} className="flex items-center gap-2 rounded-md font-medium text-m3-secondary transition-colors hover:text-m3-text focus-visible:outline-2 focus-visible:outline-m3-primary">
                  {item.icon}
                  {item.label}
                </button>
              )}
            </span>
          ))}
          {context}
        </nav>
      </div>
      <div className="flex w-full min-w-0 items-center justify-end gap-2 overflow-visible md:w-auto md:gap-3">
        {search && (
          <div data-tour={search.tourId} className="relative min-w-0 flex-1 sm:w-64 md:flex-none">
            <input
              type="search"
              value={search.value}
              onChange={(event) => search.onChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") search.onChange("");
              }}
              placeholder={search.placeholder}
              aria-label={search.label}
              className="h-10 w-full rounded-lg border border-m3-border bg-m3-card py-2 pl-10 pr-10 text-sm text-m3-text outline-none transition-[border-color,box-shadow] placeholder:text-m3-input focus:border-m3-primary focus:ring-2 focus:ring-m3-primary/20"
            />
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-m3-secondary" aria-hidden="true" />
            {search.value && (
              <button type="button" onClick={() => search.onChange("")} className="absolute right-1 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-m3-secondary transition-colors hover:bg-m3-hover hover:text-m3-text" aria-label={search.clearLabel} title={search.clearLabel}>
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        )}
        {actions}
      </div>
    </WorkspaceHeader>
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
