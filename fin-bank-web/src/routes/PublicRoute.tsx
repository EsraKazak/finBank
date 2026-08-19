import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

// giriş yapmamışlar için herkesin ilk ekranı
export const PublicRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;

  // Giriş yapmışsa doğrudan Dashboard'a yönlendir
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};
