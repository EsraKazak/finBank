// src/routes/ProtectedRoute.tsx
import { Navigate, Outlet } from "react-router-dom";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useAuth } from "../hooks/useAuth";

export const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          gap: 2,
        }}
      >
        <CircularProgress size={48} thickness={4} />
        <Typography variant="body1" color="text.secondary">
          Yükleniyor...
        </Typography>
      </Box>
    );
  }

  // Doğrulama bittiğinde oturum yoksa Login'e at:
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Oturum varsa sayfayı (Dashboard) göster:
  return <Outlet />;
};
