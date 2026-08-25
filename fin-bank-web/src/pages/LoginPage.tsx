import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Paper,
  Typography,
  Box,
  Snackbar,
  Alert,
  Tabs,
  Tab,
  TextField,
  Button,
  Link,
  CircularProgress,
  InputAdornment,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import HowToRegOutlinedIcon from "@mui/icons-material/HowToRegOutlined";
import LoginIcon from "@mui/icons-material/Login";
import { LoginForm } from "../features/auth/LoginForm";
import { useAuth } from "../hooks/useAuth";
import api from "../services/api";

const cleanTurkishChars = (str: string) => {
  const trMap: { [key: string]: string } = {
    ç: "c",
    Ç: "c",
    ğ: "g",
    Ğ: "g",
    ı: "i",
    İ: "i",
    ö: "o",
    Ö: "o",
    ş: "s",
    Ş: "s",
    ü: "u",
    Ü: "u",
  };
  return str
    .replace(/[çÇğĞıİöÖşŞüÜ]/g, (match) => trMap[match] || match)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
};

export const LoginPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [registerForm, setRegisterForm] = useState({
    name: "",
    surname: "",
    email: "",
  });

  const { login } = useAuth();
  const navigate = useNavigate();

  // Ad ve Soyad yazıldıkça mgenc formatında önizleme üretir
  const generatedUsername = useMemo(() => {
    const cName = cleanTurkishChars(registerForm.name.trim());
    const cSurname = cleanTurkishChars(registerForm.surname.trim());
    if (!cName || !cSurname) return "";
    return `${cName.charAt(0)}${cSurname}`;
  }, [registerForm.name, registerForm.surname]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setError(null);
    setSuccessMsg(null);
  };

  const handleLogin = async (username: string, pass: string) => {
    setError(null);
    setLoading(true);
    try {
      await login(username, pass);
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Giriş yapılamadı. Lütfen bilgilerinizi kontrol edin.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRegisterForm({
      ...registerForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      await api.post("/auth/register", {
        name: registerForm.name,
        surname: registerForm.surname,
        email: registerForm.email,
      });

      setSuccessMsg(
        "Personel kaydı oluşturuldu! Şifre belirleme bağlantısı e-posta adresine gönderildi.",
      );
      setRegisterForm({
        name: "",
        surname: "",
        email: "",
      });
      setActiveTab(0);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Kayıt işlemi başarısız. Lütfen bilgileri kontrol edin.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = (
    _event?: React.SyntheticEvent | Event,
    reason?: string,
  ) => {
    if (reason === "clickaway") return;
    setSuccessMsg(null);
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
          maxWidth: activeTab === 1 ? 520 : 440,
          p: { xs: 3, sm: 4.5 },
          borderRadius: 4,
          backgroundColor: "rgba(255, 255, 255, 0.96)",
          backdropFilter: "blur(12px)",
          boxShadow: "0 20px 45px rgba(0, 0, 0, 0.35)",
          transition: "max-width 0.3s ease",
        }}
      >
        {/* Logo ve Başlık */}
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <Box
            component="img"
            src="/favicon.ico"
            alt="FinBank Logo"
            onError={(e: any) => {
              e.currentTarget.style.display = "none";
            }}
            sx={{
              width: 56,
              height: 56,
              mx: "auto",
              mb: 1.5,
              borderRadius: "50%",
              boxShadow: "0 4px 14px rgba(10, 25, 47, 0.15)",
            }}
          />
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              letterSpacing: "-0.5px",
              background: "linear-gradient(45deg, #0a192f 30%, #1976d2 90%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            FinBank
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "text.secondary", mt: 0.5, fontWeight: 500 }}
          >
            Personel Yönetim & Yetkilendirme Portalı
          </Typography>
        </Box>

        {/* Sekmeler */}
        <Box
          sx={{
            p: 0.6,
            bgcolor: "#f1f5f9",
            borderRadius: 3,
            mb: 3,
          }}
        >
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              minHeight: 40,
              "& .MuiTabs-indicator": { display: "none" },
              "& .MuiTab-root": {
                minHeight: 40,
                borderRadius: 2.5,
                fontWeight: 600,
                fontSize: "0.875rem",
                textTransform: "none",
                color: "#64748b",
                transition: "all 0.2s ease-in-out",
                "&.Mui-selected": {
                  color: "#0a192f",
                  bgcolor: "#ffffff",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                },
              },
            }}
          >
            <Tab
              icon={<LoginIcon sx={{ fontSize: 18 }} />}
              iconPosition="start"
              label="Giriş Yap"
            />
            <Tab
              icon={<HowToRegOutlinedIcon sx={{ fontSize: 18 }} />}
              iconPosition="start"
              label="Yeni Personel"
            />
          </Tabs>
        </Box>

        {/* 1. SEKME: GİRİŞ FORMU */}
        {activeTab === 0 && (
          <Box sx={{ width: "100%" }}>
            <LoginForm
              onSubmit={handleLogin}
              isLoading={loading}
              errorMessage={error}
            />
            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
              <Link
                component="button"
                type="button"
                variant="body2"
                onClick={() => navigate("/forgot-password")}
                sx={{
                  color: "primary.main",
                  fontWeight: 600,
                  textDecoration: "none",
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                Şifremi unuttum?
              </Link>
            </Box>
          </Box>
        )}

        {/* 2. SEKME: ŞİFRESİZ VE OTOMATİK KULLANICI ADLI KAYIT FORMU */}
        {activeTab === 1 && (
          <Box
            component="form"
            onSubmit={handleRegisterSubmit}
            sx={{ width: "100%" }}
          >
            {error && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            <Box sx={{ display: "flex", gap: 1.5, mb: 1.5 }}>
              <TextField
                required
                fullWidth
                size="small"
                id="name"
                label="Ad"
                name="name"
                value={registerForm.name}
                onChange={handleRegisterChange}
                disabled={loading}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <BadgeOutlinedIcon
                          fontSize="small"
                          sx={{ color: "action.active" }}
                        />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <TextField
                required
                fullWidth
                size="small"
                id="surname"
                label="Soyad"
                name="surname"
                value={registerForm.surname}
                onChange={handleRegisterChange}
                disabled={loading}
              />
            </Box>

            {/* Otomatik Üretilen Kullanıcı Adı (Salt Okunur) */}
            <TextField
              margin="dense"
              fullWidth
              size="small"
              id="register-username"
              label="Kullanıcı Adı (Sistem Tarafından Oluşturulur)"
              value={generatedUsername}
              disabled
              sx={{
                mb: 1.5,
                "& .MuiInputBase-input.Mui-disabled": {
                  WebkitTextFillColor: "#0a192f",
                  fontWeight: 600,
                },
                "& .MuiOutlinedInput-root.Mui-disabled": {
                  bgcolor: "#f8fafc",
                },
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon
                        fontSize="small"
                        sx={{ color: "primary.main" }}
                      />
                    </InputAdornment>
                  ),
                },
              }}
            />

            <TextField
              margin="dense"
              required
              fullWidth
              size="small"
              id="register-email"
              label="Kurumsal E-posta"
              name="email"
              type="email"
              value={registerForm.email}
              onChange={handleRegisterChange}
              disabled={loading}
              sx={{ mb: 2 }}
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
              disabled={loading}
              sx={{
                mt: 1,
                py: 1.2,
                fontSize: "0.95rem",
                fontWeight: 700,
                textTransform: "none",
                borderRadius: 2.5,
                background: "linear-gradient(135deg, #1976d2 0%, #0d47a1 100%)",
                boxShadow: "0 6px 16px rgba(25, 118, 210, 0.35)",
                "&:hover": {
                  background:
                    "linear-gradient(135deg, #1565c0 0%, #0a3880 100%)",
                },
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Davet Bağlantısı Gönder"
              )}
            </Button>
          </Box>
        )}
      </Paper>

      {/* Sadece Başarılı İşlemlerde Çıkan Tekil Bildirim */}
      <Snackbar
        open={Boolean(successMsg)}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity="success"
          variant="filled"
          sx={{ width: "100%", borderRadius: 2, boxShadow: 6 }}
        >
          {successMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
};
