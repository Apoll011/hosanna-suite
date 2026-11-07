import { configureApiClient } from "@/src/api";
import { preloadEditor } from "@hosanna/chordpro/editor";
import { useEffect } from "react";
import { BrowserRouter, useLocation } from "react-router-dom";
import { NavigationProgressBar } from "./components/NavigationProgressBar";
import { InteractiveOnboardingController } from "./components/tour/InteractiveOnboardingController";
import { AuthProvider } from "./contexts/AuthContext";
import { CacheHydrationProvider } from "./contexts/CacheHydrationProvider";
import { NavigationTransitionProvider } from "./contexts/NavigationTransitionContext";
import { PrintProvider } from "./contexts/PrintContext";
import { SyncProvider } from "./contexts/SyncContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { I18nProvider } from "./lib/i18n";
import { posthog } from "./lib/posthog";
import { AppRoutes } from "./routes/AppRoutes";

configureApiClient(
  localStorage.getItem("server_url") || import.meta.env.VITE_API_URL || "/api",
);

function PageviewTracker() {
  const location = useLocation();
  useEffect(() => {
    posthog.capture("$pageview", { $current_url: window.location.href });
  }, [location.pathname, location.search]);
  return null;
}

export default function App() {
  useEffect(() => {
    const id = setTimeout(() => {
      void preloadEditor();
    }, 3000);
    return () => clearTimeout(id);
  }, []);

  return (
    <AuthProvider>
      <I18nProvider>
        <ThemeProvider>
          <SyncProvider>
            <CacheHydrationProvider>
              <PrintProvider>
                <BrowserRouter>
                  <NavigationTransitionProvider>
                    <PageviewTracker />
                    <NavigationProgressBar />
                    <InteractiveOnboardingController />
                    <AppRoutes />
                  </NavigationTransitionProvider>
                </BrowserRouter>
              </PrintProvider>
            </CacheHydrationProvider>
          </SyncProvider>
        </ThemeProvider>
      </I18nProvider>
    </AuthProvider>
  );
}
