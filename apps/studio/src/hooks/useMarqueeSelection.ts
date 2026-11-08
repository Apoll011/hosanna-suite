import { useCallback, useEffect, useRef, useState } from "react";

export interface SelectionBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface MarqueeSelectionOptions {
  containerRef: React.RefObject<HTMLElement | null>;
  enabled?: boolean;
  selectedIds: Set<string>;
  onSelectionChange: (newSelectedIds: Set<string>) => void;
  onClearSelection?: () => void;
}

export function useMarqueeSelection({
  containerRef,
  enabled = true,
  selectedIds,
  onSelectionChange,
  onClearSelection,
}: MarqueeSelectionOptions) {
  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);
  const isMouseDownRef = useRef(false);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const initialSelectionRef = useRef<Set<string>>(new Set());

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!enabled || e.button !== 0) return;
      const target = e.target as HTMLElement;
      if (target.closest('button, input, a, [role="dialog"], [data-item-id]')) {
        return;
      }

      isMouseDownRef.current = true;
      startPosRef.current = { x: e.clientX, y: e.clientY };

      if (!e.ctrlKey && !e.metaKey) {
        onClearSelection?.();
        initialSelectionRef.current = new Set();
      } else {
        initialSelectionRef.current = new Set(selectedIds);
      }
    },
    [enabled, selectedIds, onClearSelection],
  );

  useEffect(() => {
    if (!enabled) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isMouseDownRef.current || !startPosRef.current || !containerRef.current) {
        return;
      }

      const startX = startPosRef.current.x;
      const startY = startPosRef.current.y;
      const left = Math.min(startX, e.clientX);
      const top = Math.min(startY, e.clientY);
      const width = Math.abs(e.clientX - startX);
      const height = Math.abs(e.clientY - startY);

      if (width > 4 || height > 4) {
        setSelectionBox({ x: left, y: top, width, height });

        const itemEls = containerRef.current.querySelectorAll<HTMLElement>("[data-item-id]");
        const next = new Set(initialSelectionRef.current);

        itemEls.forEach((el) => {
          const id = el.getAttribute("data-item-id");
          if (!id) return;
          const rect = el.getBoundingClientRect();
          const intersects = !(
            rect.right < left ||
            rect.left > left + width ||
            rect.bottom < top ||
            rect.top > top + height
          );
          if (intersects) {
            next.add(id);
          }
        });

        onSelectionChange(next);
      }
    };

    const handleMouseUp = () => {
      if (isMouseDownRef.current) {
        isMouseDownRef.current = false;
        startPosRef.current = null;
        setSelectionBox(null);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [enabled, containerRef, onSelectionChange]);

  return {
    selectionBox,
    handleMouseDown,
  };
}
