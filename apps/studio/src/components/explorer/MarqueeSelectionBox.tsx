import React from "react";
import { SelectionBox } from "../../hooks/useMarqueeSelection";

interface MarqueeSelectionBoxProps {
  box: SelectionBox | null;
}

export const MarqueeSelectionBox: React.FC<MarqueeSelectionBoxProps> = ({
  box,
}) => {
  if (!box) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: box.x,
        top: box.y,
        width: box.width,
        height: box.height,
        pointerEvents: "none",
        zIndex: 100,
      }}
      className="border-2 border-m3-primary bg-m3-primary/25 rounded-[var(--radius-md)] shadow-[var(--shadow-md)] backdrop-blur-[1px] select-none"
    />
  );
};
