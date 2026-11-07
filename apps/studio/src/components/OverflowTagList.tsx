import { Badge } from "@/src/components/common";
import React, { useLayoutEffect, useMemo, useRef, useState } from "react";

interface OverflowTagListProps {
  tags?: string[] | null;
}

export const OverflowTagList: React.FC<OverflowTagListProps> = ({ tags }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const safeTags = useMemo(() => tags ?? [], [tags]);

  const [visibleCount, setVisibleCount] = useState<number>(safeTags.length);
  const [isMeasured, setIsMeasured] = useState<boolean>(false);

  useLayoutEffect(() => {
    if (safeTags.length === 0) {
      setVisibleCount(0);
      setIsMeasured(true);
      return;
    }

    const calculateOverflow = () => {
      const container = containerRef.current;
      if (!container) return;

      const containerWidth = container.clientWidth;
      if (containerWidth <= 0) return;

      const children = Array.from(container.children) as HTMLElement[];
      if (children.length === 0) return;

      const gap = 6; // gap-1.5 = 6px
      let currentWidth = 0;
      let count = 0;
      const badgeWidthEstimate = 32; // reserve width for +N badge

      // When checking fit, we measure how many tag elements can fit
      for (let i = 0; i < safeTags.length; i++) {
        const child = children[i];
        if (!child) break;

        const childWidth = child.offsetWidth;
        const widthNeeded = currentWidth + (count > 0 ? gap : 0) + childWidth;

        // If there are more tags remaining after this one, we must also fit the +N badge
        const hasMoreAfter = i < safeTags.length - 1;
        const totalNeededWithBadge =
          widthNeeded + (hasMoreAfter ? gap + badgeWidthEstimate : 0);

        if (
          totalNeededWithBadge <= containerWidth ||
          (!hasMoreAfter && widthNeeded <= containerWidth)
        ) {
          currentWidth = widthNeeded;
          count++;
        } else {
          break;
        }
      }

      setVisibleCount(count);
      setIsMeasured(true);
    };

    calculateOverflow();

    const resizeObserver = new ResizeObserver(() => {
      calculateOverflow();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [safeTags]);

  if (safeTags.length === 0) {
    return <span className="text-xs text-m3-secondary opacity-30">—</span>;
  }

  const hiddenCount = safeTags.length - visibleCount;

  return (
    <div
      ref={containerRef}
      className="flex flex-nowrap items-center gap-1.5 overflow-hidden w-full max-w-full h-6"
    >
      {safeTags.map((tag, index) => {
        const isHidden = isMeasured && index >= visibleCount;
        return (
          <div
            key={tag}
            className={`shrink-0 ${isHidden ? "hidden" : "inline-flex"}`}
          >
            <Badge variant="slate">{tag}</Badge>
          </div>
        );
      })}

      {isMeasured && hiddenCount > 0 && (
        <div className="shrink-0 inline-flex">
          <Badge variant="slate">+{hiddenCount}</Badge>
        </div>
      )}
    </div>
  );
};
