import React from "react";
import { useNavTransition } from "../contexts/NavigationTransitionContext";

export const NavigationProgressBar: React.FC = () => {
  const { isPending } = useNavTransition();

  if (!isPending) return null;

  return (
    <div className="fixed top-0 left-0 right-0 h-0.5 z-9999 overflow-hidden pointer-events-none">
      <div className="h-full bg-m3-primary animate-[loading-bar_1s_ease-in-out_infinite]" />
    </div>
  );
};
