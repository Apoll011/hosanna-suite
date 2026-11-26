// SPDX-License-Identifier: AGPL-3.0-only
import { Children, cloneElement, forwardRef, useMemo } from "react";

import { cn } from "../lib/cn";

import type { CSSProperties, ElementRef, HTMLAttributes, ReactElement } from "react";

// ================================== //

type TAvatarGroupRef = ElementRef<"div">;
type TAvatarGroupProps = HTMLAttributes<HTMLDivElement> & { max?: number; spacing?: number };
type TAvatarItem = { className?: string; style?: CSSProperties };

const AvatarGroup = forwardRef<TAvatarGroupRef, TAvatarGroupProps>(
  ({ className, children, max = 1, spacing = 10, ...props }, ref) => {
    const avatarItems = Children.toArray(children) as ReactElement<TAvatarItem>[];

    const renderContent = useMemo(() => {
      return (
        <>
          {avatarItems.slice(0, max).map((child, index) => {
            return cloneElement(child, {
              className: cn(child.props.className, "border-1 border-background"),
              style: { marginLeft: index === 0 ? 0 : -spacing, ...child.props.style },
            });
          })}

          {avatarItems.length > max && (
            <div
              className={cn(
                "relative flex items-center justify-center rounded-full border-1 border-background bg-m3-hover",
                avatarItems[0].props.className,
              )}
              style={{ marginLeft: -spacing }}
            >
              <p>+{avatarItems.length - max}</p>
            </div>
          )}
        </>
      );
    }, [avatarItems, max, spacing]);

    return (
      <div ref={ref} className={cn("relative flex", className)} {...props}>
        {renderContent}
      </div>
    );
  },
);

AvatarGroup.displayName = "AvatarGroup";

// ================================== //

export { AvatarGroup };
