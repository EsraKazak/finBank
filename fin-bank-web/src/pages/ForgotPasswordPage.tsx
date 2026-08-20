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
  Link,
} from "@mui/material";
import LockResetIcon from "@mui/icons-material/LockReset";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const response = await api.post("/auth/forgot-password", { email });
      setMessage(response.data.message);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Bağlantı gönderilirken bir hata oluştu.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs" sx={{ mt: 10 }}>
      <Paper elevation={4} sx={{ p: 4, borderRadius: 3, textAlign: "center" }}>
        <LockResetIcon color="primary" sx={{ fontSize: 50, mb: 1 }} />
        <Typography component="h1" variant="h5" sx={{ fontWeight: 700 }}>
          Şifremi Unuttum
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 1, mb: 3 }}
        >
          Kayıtlı e-posta adresinizi girin; size şifre sıfırlama bağlantısı
          gönderelim.
        </Typography>

        {message && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {message}
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Kurumsal E-posta Adresi"
            name="email"
            type="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{ mt: 2.5, mb: 2, py: 1.2, fontWeight: 600 }}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Sıfırlama Bağlantısı Gönder"
            )}
          </Button>

          <Box sx={{ mt: 1 }}>
            <Link
              component="button"
              type="button"
              variant="body2"
              onClick={() => navigate("/login")}
              sx={{ textDecoration: "none" }}
            >
              Giriş Ekranına Dön
            </Link>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};
