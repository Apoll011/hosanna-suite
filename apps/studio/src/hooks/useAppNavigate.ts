// SPDX-License-Identifier: AGPL-3.0-only
import { useNavTransition } from "../contexts/NavigationTransitionContext";

export function useAppNavigate() {
  return useNavTransition();
}
