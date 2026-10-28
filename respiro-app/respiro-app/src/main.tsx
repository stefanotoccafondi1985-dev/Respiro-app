import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import { isNative } from "./lib/platform";
import "./styles.css";

// Nell'app Android i file sono già dentro l'APK: il service worker serve solo sul web.
if (!isNative()) registerSW({ immediate: true });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
