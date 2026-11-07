// hooks/useAppNavigate.ts
import { useNavTransition } from "../contexts/NavigationTransitionContext";

export function useAppNavigate() {
  return useNavTransition();
}
