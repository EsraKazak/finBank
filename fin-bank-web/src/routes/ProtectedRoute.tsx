import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useAuth } from "../hooks/useAuth";

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // 1. Backend doğrulaması bitene kadar içeriği ASLA açma
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
          bgcolor: "#f8fafc",
        }}
      >
        <CircularProgress size={44} thickness={4} />
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontWeight: 600 }}
        >
          Güvenli oturum doğrulanıyor...
        </Typography>
      </Box>
    );
  }

  // 2. Doğrulama bittiğinde kullanıcı geçerli değilse anında Login'e at
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Oturum geçerliyse alt sayfaları göster
  return <Outlet />;
};
