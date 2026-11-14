import { applySuiteAppAccent } from "@hosanna/auth";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { getDatabase } from "./db";
import "./index.css";
import "./lib/posthog";

applySuiteAppAccent("music");
getDatabase();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
