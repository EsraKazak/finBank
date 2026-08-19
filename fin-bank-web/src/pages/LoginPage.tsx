import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Paper,
  Typography,
  Box,
  Snackbar,
  Alert,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { LoginForm } from "../features/auth/LoginForm";
import { useAuth } from "../hooks/useAuth";

export const LoginPage: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // AuthContext'ten login metodunu alıyoruz
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (username: string, pass: string) => {
    setError(null);
    setLoading(true);
    try {
      // 1. AuthContext login fonksiyonunu çağır (API + State + localStorage güncellenir)
      await login(username, pass);

      // 2. Başarılı girişte Dashboard sayfasına yönlendir
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Giriş yapılamadı. Bilgilerinizi kontrol edin.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = (
    _event?: React.SyntheticEvent | Event,
    reason?: string,
  ) => {
    if (reason === "clickaway") {
      return;
    }
    setError(null);
  };

  return (
    <Container maxWidth="xs" sx={{ mt: 10, mb: 4 }}>
      <Paper
        elevation={4}
        sx={{
          p: 4,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          borderRadius: 3,
        }}
      >
        {/* Logo ve Başlık */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            color: "primary.main",
            mb: 2,
          }}
        >
          <LockOutlinedIcon fontSize="large" />
          <Typography variant="h4" component="h1" sx={{ fontWeight: "bold" }}>
            FinBank
          </Typography>
        </Box>

        {/* Giriş Formu */}
        <LoginForm
          onSubmit={handleLogin}
          isLoading={loading}
          errorMessage={error}
        />
      </Paper>

      {/* Sağ Üstte Açılan MUI Snackbar (Toast) Bildirimi */}
      <Snackbar
        open={Boolean(error)}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity="error"
          variant="filled"
          sx={{ width: "100%", boxShadow: 3 }}
        >
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
};
