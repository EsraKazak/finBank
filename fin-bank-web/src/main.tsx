import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import App from "./App.tsx";
import { AuthProvider } from "./context/AuthContext.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  ModuleRegistry,
  AllCommunityModule,
  ValidationModule,
} from "ag-grid-community";

ModuleRegistry.registerModules([AllCommunityModule, ValidationModule]);

// TanStack Query İstemcisi
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 30, // 30 dakika boyunca önbellekteki veriyi taze sayar
      gcTime: 1000 * 60 * 60, // 1 saat hafızada tutar
      refetchOnWindowFocus: false, // Sekmeler arası geçişte gereksiz ağ isteği atmaz
      retry: 1, // Hata anında en fazla 1 kez tekrar dener
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
