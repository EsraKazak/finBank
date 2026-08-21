import React, { useState } from "react";
import {
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Link,
  InputAdornment,
} from "@mui/material";
import LockResetIcon from "@mui/icons-material/LockReset";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SendIcon from "@mui/icons-material/Send";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const isSuccess = Boolean(message);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const response = await api.post("/auth/forgot-password", { email });
      setMessage(
        response.data.message ||
          "Sıfırlama bağlantısı e-posta adresinize gönderildi.",
      );
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Bağlantı gönderilirken bir hata oluştu. Lütfen bilgilerinizi kontrol edin.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, #0a192f 0%, #172a45 50%, #0d2538 100%)",
        p: 2,
      }}
    >
      <Paper
        elevation={12}
        sx={{
          width: "100%",
          maxWidth: 440,
          p: { xs: 3.5, sm: 4.5 },
          borderRadius: 4,
          backgroundColor: "rgba(255, 255, 255, 0.96)",
          backdropFilter: "blur(12px)",
          boxShadow: "0 20px 45px rgba(0, 0, 0, 0.35)",
          textAlign: "center",
        }}
      >
        {/* İkon Rozeti */}
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)",
            color: "primary.main",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mx: "auto",
            mb: 2,
            boxShadow: "0 6px 16px rgba(25, 118, 210, 0.15)",
          }}
        >
          <LockResetIcon sx={{ fontSize: 34 }} />
        </Box>

        {/* Başlık ve Açıklama */}
        <Typography
          variant="h5"
          component="h1"
          sx={{
            fontWeight: 800,
            letterSpacing: "-0.3px",
            background: "linear-gradient(45deg, #0a192f 30%, #1976d2 90%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            mb: 1,
          }}
        >
          Şifre Sıfırlama
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: "text.secondary", mb: 3, lineHeight: 1.6 }}
        >
          Kayıtlı kurumsal e-posta adresinizi girin; hesabınıza güvenli erişim
          için şifre sıfırlama bağlantısı gönderelim.
        </Typography>

        {/* Başarı / Hata Bildirimleri */}
        {message && (
          <Alert
            severity="success"
            variant="filled"
            sx={{ mb: 2.5, borderRadius: 2, textAlign: "left" }}
          >
            {message}
          </Alert>
        )}
        {error && (
          <Alert
            severity="error"
            variant="filled"
            sx={{ mb: 2.5, borderRadius: 2, textAlign: "left" }}
          >
            {error}
          </Alert>
        )}

        {/* Form Alanı */}
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            margin="normal"
            required
            fullWidth
            size="small"
            id="email"
            label="Kurumsal E-posta Adresi"
            name="email"
            type="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading || isSuccess}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailOutlinedIcon
                      fontSize="small"
                      sx={{ color: "action.active" }}
                    />
                  </InputAdornment>
                ),
              },
            }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading || isSuccess}
            endIcon={
              !loading && !isSuccess ? (
                <SendIcon sx={{ fontSize: 18 }} />
              ) : undefined
            }
            sx={{
              mt: 2.5,
              mb: 2,
              py: 1.2,
              fontSize: "0.95rem",
              fontWeight: 700,
              textTransform: "none",
              borderRadius: 2.5,
              background: "linear-gradient(135deg, #1976d2 0%, #0d47a1 100%)",
              boxShadow: "0 6px 16px rgba(25, 118, 210, 0.35)",
              "&:hover": {
                background: "linear-gradient(135deg, #1565c0 0%, #0a3880 100%)",
              },
            }}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : isSuccess ? (
              "Bağlantı Gönderildi"
            ) : (
              "Sıfırlama Bağlantısı Gönder"
            )}
          </Button>

          {/* Giriş Ekranına Dön */}
          <Box sx={{ mt: 2 }}>
            <Link
              component="button"
              type="button"
              variant="body2"
              onClick={() => navigate("/login")}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.5,
                color: "text.secondary",
                fontWeight: 600,
                textDecoration: "none",
                transition: "color 0.2s ease",
                "&:hover": {
                  color: "primary.main",
                  textDecoration: "none",
                },
              }}
            >
              <ArrowBackIcon sx={{ fontSize: 16 }} />
              Giriş Ekranına Dön
            </Link>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};
