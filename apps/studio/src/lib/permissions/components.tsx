import React, { type ReactNode } from "react";
import {
  useActiveRole,
  useAnyRole,
  useCan,
  useCanAll,
  useCanAny,
  useCannot,
  useRole,
} from "./client";
import type { PermissionString } from "./permission";
import type { AppRole } from "./roles";

// ---------------------------------------------------------------------------
// Shared props
// ---------------------------------------------------------------------------

interface GateBaseProps<T> {
  fallback?: ReactNode;
  loading?: ReactNode;
  /**
   * Supports standard React nodes, OR a function that exposes the gate's status.
   * Useful for disabling elements instead of hiding them.
   */
  children: ReactNode | ((status: T) => ReactNode);
}

// Helper to resolve children (handles Render Props vs Standard Children)
function resolveChildren<T>(
  children: GateBaseProps<T>["children"],
  status: T,
  condition: boolean,
  fallback: ReactNode,
) {
  if (typeof children === "function") {
    return <>{children(status)}</>;
  }
  return <>{condition ? children : fallback}</>;
}

// ---------------------------------------------------------------------------
// Single Permission Gates
// ---------------------------------------------------------------------------

interface CanProps extends GateBaseProps<{
  granted: boolean;
  loading: boolean;
}> {
  permission: PermissionString;
}

/**
 * @example
 * // Hiding (Standard)
 * <Can permission="song.edit" fallback={<Unauthorized />}>
 *   <EditForm />
 * </Can>
 *
 * // Disabling (Render Prop)
 * <Can permission="song.edit">
 *   {({ granted }) => <button disabled={!granted}>Edit</button>}
 * </Can>
 */
export const Can: React.FC<CanProps> = ({
  permission,
  children,
  fallback = null,
  loading: loadingSlot = null,
}) => {
  const status = useCan(permission);
  if (status.loading && typeof children !== "function")
    return <>{loadingSlot}</>;
  return resolveChildren(children, status, status.granted, fallback);
};

interface CannotProps extends GateBaseProps<{
  denied: boolean;
  loading: boolean;
}> {
  permission: PermissionString;
}

export const Cannot: React.FC<CannotProps> = ({
  permission,
  children,
  fallback = null,
  loading: loadingSlot = null,
}) => {
  const status = useCannot(permission);
  if (status.loading && typeof children !== "function")
    return <>{loadingSlot}</>;
  return resolveChildren(children, status, status.denied, fallback);
};

// ---------------------------------------------------------------------------
// Multi-Permission Gates
// ---------------------------------------------------------------------------

interface MultiCanProps extends GateBaseProps<{
  granted: boolean;
  loading: boolean;
}> {
  permissions: PermissionString[];
}

/** Renders if the user has ALL of the specified permissions. */
export const CanAll: React.FC<MultiCanProps> = ({
  permissions,
  children,
  fallback = null,
  loading: loadingSlot = null,
}) => {
  const status = useCanAll(permissions);
  if (status.loading && typeof children !== "function")
    return <>{loadingSlot}</>;
  return resolveChildren(children, status, status.granted, fallback);
};

/** Renders if the user has AT LEAST ONE of the specified permissions. */
export const CanAny: React.FC<MultiCanProps> = ({
  permissions,
  children,
  fallback = null,
  loading: loadingSlot = null,
}) => {
  const status = useCanAny(permissions);
  if (status.loading && typeof children !== "function")
    return <>{loadingSlot}</>;
  return resolveChildren(children, status, status.granted, fallback);
};

// ---------------------------------------------------------------------------
// Role Gates & Switches
// ---------------------------------------------------------------------------

interface RoleGateProps extends GateBaseProps<{
  matched: boolean;
  loading: boolean;
}> {
  role: AppRole;
}

export const RoleGate: React.FC<RoleGateProps> = ({
  role,
  children,
  fallback = null,
  loading: loadingSlot = null,
}) => {
  const status = useRole(role);
  if (status.loading && typeof children !== "function")
    return <>{loadingSlot}</>;
  return resolveChildren(children, status, status.matched, fallback);
};

interface AnyRoleGateProps extends GateBaseProps<{
  matched: boolean;
  loading: boolean;
}> {
  roles: AppRole[];
}

export const AnyRoleGate: React.FC<AnyRoleGateProps> = ({
  roles,
  children,
  fallback = null,
  loading: loadingSlot = null,
}) => {
  const status = useAnyRole(...roles);
  if (status.loading && typeof children !== "function")
    return <>{loadingSlot}</>;
  return resolveChildren(children, status, status.matched, fallback);
};

interface RoleSwitchProps {
  /** Map roles to specific components */
  roles: Partial<Record<AppRole, ReactNode>>;
  fallback?: ReactNode;
  loading?: ReactNode;
}

/**
 * Functions like a Switch statement for roles.
 * @example
 * <RoleSwitch
 *   roles={{
 *     owner: <OwnerDashboard />,
 *     admin: <AdminDashboard />
 *   }}
 *   fallback={<GuestDashboard />}
 * />
 */
export const RoleSwitch: React.FC<RoleSwitchProps> = ({
  roles,
  fallback = null,
  loading: loadingSlot = null,
}) => {
  const { role, loading } = useActiveRole();
  if (loading) return <>{loadingSlot}</>;
  if (role && roles[role]) return <>{roles[role]}</>;
  return <>{fallback}</>;
};

// ---------------------------------------------------------------------------
// Higher-Order Components (HOCs) for Page/Route Protection
// ---------------------------------------------------------------------------

/**
 * Wraps a component so it can only be accessed if the user has the required permission.
 */
export function withPermission<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  permission: PermissionString,
  FallbackComponent?: React.ComponentType<P>,
) {
  return function WithPermissionWrapper(props: P) {
    return (
      <Can
        permission={permission}
        fallback={FallbackComponent ? <FallbackComponent {...props} /> : null}
      >
        <WrappedComponent {...props} />
      </Can>
    );
  };
}

/**
 * Wraps a component so it can only be accessed by a specific role.
 */
export function withRole<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  role: AppRole,
  FallbackComponent?: React.ComponentType<P>,
) {
  return function WithRoleWrapper(props: P) {
    return (
      <RoleGate
        role={role}
        fallback={FallbackComponent ? <FallbackComponent {...props} /> : null}
      >
        <WrappedComponent {...props} />
      </RoleGate>
    );
  };
}
