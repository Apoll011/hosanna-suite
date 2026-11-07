// contexts/NavigationTransitionContext.tsx
import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  useTransition,
} from "react";
import { useNavigate, type NavigateOptions, type To } from "react-router-dom";
import { preloadRoute } from "../routes/routePreloader";

export interface NavigationTransitionContextType {
  navigate: (to: To | number, options?: NavigateOptions) => void;
  isPending: boolean;
}

const Ctx = createContext<NavigationTransitionContextType | null>(null);

export const NavigationTransitionProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const navigate = useNavigate();
  const [transitionPending, startTransition] = useTransition();
  const [isPreloading, setIsPreloading] = useState(false);
  const activeNavIdRef = useRef(0);

  const go = useCallback(
    (to: To | number, options?: NavigateOptions) => {
      if (typeof to === "number") {
        startTransition(() => {
          navigate(to);
        });
        return;
      }

      const path = typeof to === "string" ? to : to.pathname || "";
      const navId = ++activeNavIdRef.current;
      const promise = preloadRoute(path);

      if (promise) {
        setIsPreloading(true);
        promise.finally(() => {
          if (activeNavIdRef.current === navId) {
            startTransition(() => {
              navigate(to, options);
              setIsPreloading(false);
            });
          }
        });
      } else {
        startTransition(() => {
          navigate(to, options);
          setIsPreloading(false);
        });
      }
    },
    [navigate],
  );

  const isPending = isPreloading || transitionPending;

  return (
    <Ctx.Provider value={{ navigate: go, isPending }}>{children}</Ctx.Provider>
  );
};

export const useNavTransition = () => {
  const ctx = useContext(Ctx);
  if (!ctx)
    throw new Error(
      "useNavTransition must be used within NavigationTransitionProvider",
    );
  return ctx;
};
