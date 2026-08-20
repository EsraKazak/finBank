import React, { useState } from "react";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
} from "@mui/material";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../services/api";

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Şifreler birbiriyle eşleşmiyor.");
      return;
    }
    if (!token) {
      setError("Geçersiz veya eksik sıfırlama kodu.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await api.post("/auth/reset-password", { token, password });
      setMessage(res.data.message);
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Şifre sıfırlama işlemi başarısız.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs" sx={{ mt: 10 }}>
      <Paper elevation={4} sx={{ p: 4, borderRadius: 3, textAlign: "center" }}>
        <LockOpenIcon color="primary" sx={{ fontSize: 48, mb: 1 }} />
        <Typography component="h1" variant="h5" sx={{ fontWeight: 700 }}>
          Yeni Şifre Belirle
        </Typography>

        {message && (
          <Alert severity="success" sx={{ my: 2 }}>
            {message}
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ my: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Yeni Şifre"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            label="Yeni Şifre (Tekrar)"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{ mt: 3, mb: 1, py: 1.2, fontWeight: 600 }}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Şifreyi Güncelle"
            )}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};
