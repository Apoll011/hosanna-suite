// SPDX-License-Identifier: AGPL-3.0-only
import { cn } from "@/lib/utils";

export function SectionHeader({
  eyebrow: _eyebrow,
  title,
  children,
  center = true,
  eyebrowClassName: _eyebrowClassName,
  titleClassName,
}: {
  eyebrow?: string;
  title: string;
  children?: React.ReactNode;
  center?: boolean;
  eyebrowClassName?: string;
  titleClassName?: string;
}) {
  return (
    <div className={cn("reveal max-w-2xl", center && "mx-auto text-center")}>
      <h2
        className={cn(
          "font-display text-3xl leading-tight tracking-tight text-foreground md:text-4xl lg:text-5xl",
          titleClassName,
        )}
      >
        {title}
      </h2>
      {children && (
        <p className="mt-5 text-base leading-relaxed text-muted-foreground md:text-lg">
          {children}
        </p>
      )}
    </div>
  );
}
