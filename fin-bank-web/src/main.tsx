import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import App from "./App.tsx";
import { AuthProvider } from "./context/AuthContext.tsx";
import { ValidationModule } from "ag-grid-community";

ModuleRegistry.registerModules([ValidationModule]);

import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";

// AG Grid topluluk modüllerini global olarak kaydediyoruz
ModuleRegistry.registerModules([AllCommunityModule]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
);
