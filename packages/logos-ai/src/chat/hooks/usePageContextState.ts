/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { aiContextBridge, buildPageContext, contextKey } from "../../core/bridge";
import { chipsForContext } from "../../core/tools";
import { useLogosHost, useLogosRoute } from "../../host";
import type { PageContextSnapshot } from "../../types";

export function usePageContextState(open: boolean) {
  const { slugPrefix, deriveView } = useLogosHost();
  const { pathname, params } = useLogosRoute();

  const routeRef = useRef({ pathname, slugPrefix, params });
  routeRef.current = { pathname, slugPrefix, params };
  const deriveViewRef = useRef(deriveView);
  deriveViewRef.current = deriveView;

  const [pageContext, setPageContext] = useState<PageContextSnapshot>(() =>
    buildPageContext(pathname, slugPrefix, params, deriveView, false),
  );

  const recomputeContext = useCallback(() => {
    const r = routeRef.current;
    const next = buildPageContext(r.pathname, r.slugPrefix, r.params, deriveViewRef.current, false);
    setPageContext((prev) => (contextKey(prev) === contextKey(next) ? prev : next));
  }, []);

  useEffect(() => {
    recomputeContext();
  }, [pathname, slugPrefix, params.id, recomputeContext]);

  // Event-driven (no polling): editors/explorer push changes into the bridge.
  useEffect(() => {
    if (!open) return;
    let timer = 0;
    const unsub = aiContextBridge.subscribe(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(recomputeContext, 250);
    });
    recomputeContext();
    return () => {
      unsub();
      window.clearTimeout(timer);
    };
  }, [open, recomputeContext]);

  const chips = useMemo(() => chipsForContext(pageContext), [pageContext]);

  return { pageContext, chips, routeRef, deriveViewRef };
}
