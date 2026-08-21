import React, { useState } from "react";
import {
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import KeyIcon from "@mui/icons-material/Key";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../services/api";

export const SetupPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isSuccess = Boolean(message);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Şifreler birbiriyle eşleşmiyor.");
      return;
    }
    if (!token) {
      setError("Geçersiz veya süresi dolmuş aktivasyon kodu.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // Backend'deki şifre belirleme ucuna istek atılır
      const res = await api.post("/auth/reset-password", { token, password });
      setMessage(
        res.data.message ||
          "Hesabınız başarıyla aktifleştirildi! Giriş sayfasına yönlendiriliyorsunuz.",
      );
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Şifre oluşturma işlemi başarısız.",
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
            background: isSuccess
              ? "linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)"
              : "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)",
            color: isSuccess ? "success.main" : "primary.main",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mx: "auto",
            mb: 2,
            boxShadow: isSuccess
              ? "0 6px 16px rgba(46, 125, 50, 0.15)"
              : "0 6px 16px rgba(25, 118, 210, 0.15)",
          }}
        >
          {isSuccess ? (
            <CheckCircleIcon sx={{ fontSize: 36 }} />
          ) : (
            <KeyIcon sx={{ fontSize: 34 }} />
          )}
        </Box>

        <Typography
          variant="h5"
          component="h1"
          sx={{
            fontWeight: 800,
            background: "linear-gradient(45deg, #0a192f 30%, #1976d2 90%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            mb: 1,
          }}
        >
          Hesap Şifresi Oluştur
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: "text.secondary", mb: 3, lineHeight: 1.6 }}
        >
          FinBank portalına erişebilmek için ilk giriş şifrenizi belirleyin.
        </Typography>

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

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            margin="normal"
            required
            fullWidth
            size="small"
            name="password"
            label="Yeni Şifre"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading || isSuccess}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon
                      fontSize="small"
                      sx={{ color: "action.active" }}
                    />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      size="small"
                    >
                      {showPassword ? (
                        <VisibilityOff fontSize="small" />
                      ) : (
                        <Visibility fontSize="small" />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          <TextField
            margin="normal"
            required
            fullWidth
            size="small"
            name="confirmPassword"
            label="Yeni Şifre (Tekrar)"
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading || isSuccess}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon
                      fontSize="small"
                      sx={{ color: "action.active" }}
                    />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      edge="end"
                      size="small"
                    >
                      {showConfirmPassword ? (
                        <VisibilityOff fontSize="small" />
                      ) : (
                        <Visibility fontSize="small" />
                      )}
                    </IconButton>
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
            sx={{
              mt: 3,
              mb: 1,
              py: 1.2,
              fontSize: "0.95rem",
              fontWeight: 700,
              textTransform: "none",
              borderRadius: 2.5,
              background: isSuccess
                ? "linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)"
                : "linear-gradient(135deg, #1976d2 0%, #0d47a1 100%)",
              boxShadow: "0 6px 16px rgba(25, 118, 210, 0.35)",
            }}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : isSuccess ? (
              "Giriş Ekranına Yönlendiriliyorsunuz..."
            ) : (
              "Şifremi Oluştur ve Kaydet"
            )}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};
