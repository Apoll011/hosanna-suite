// components/AppLink.tsx
import React from "react";
import { Link, type LinkProps } from "react-router-dom";
import { useNavTransition } from "../contexts/NavigationTransitionContext";

export const AppLink: React.FC<LinkProps> = ({ to, onClick, ...props }) => {
  const { navigate } = useNavTransition();

  return (
    <Link
      to={to}
      onClick={(e) => {
        e.preventDefault();
        onClick?.(e);
        navigate(to);
      }}
      {...props}
    />
  );
};
