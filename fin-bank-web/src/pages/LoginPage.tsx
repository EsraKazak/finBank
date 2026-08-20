import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
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
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
import { LoginForm } from "../features/auth/LoginForm";
import { useAuth } from "../hooks/useAuth";
import api from "../services/api";

export const LoginPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<number>(0); // 0: Giriş, 1: Kayıt
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Kayıt Formu State'leri
  const [registerForm, setRegisterForm] = useState({
    name: "",
    surname: "",
    username: "",
    email: "",
    password: "",
  });

  const { login } = useAuth();
  const navigate = useNavigate();

  // Sekme Değişimi
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setError(null);
    setSuccessMsg(null);
  };

  // 1. Giriş Yapma İşlemi
  const handleLogin = async (username: string, pass: string) => {
    setError(null);
    setLoading(true);
    try {
      await login(username, pass);
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

  // 2. Yeni Personel Kaydı İşlemi
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
      // Backend /auth/register ucuna istek atılıyor
      await api.post("/auth/register", {
        name: registerForm.name,
        surname: registerForm.surname,
        username: registerForm.username,
        email: registerForm.email,
        password: registerForm.password,
        role: "BANKO_ASISTANI", // Varsayılan banko asistanı rolü
      });

      setSuccessMsg(
        "Personel kaydı başarıyla oluşturuldu! Giriş yapabilirsiniz.",
      );
      setRegisterForm({
        name: "",
        surname: "",
        username: "",
        email: "",
        password: "",
      });
      setActiveTab(0); // Başarılı kayıttan sonra Giriş Yap sekmesine geçir
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
    setError(null);
    setSuccessMsg(null);
  };

  return (
    <Container maxWidth="xs" sx={{ mt: 8, mb: 4 }}>
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
            mb: 1,
          }}
        >
          <LockOutlinedIcon fontSize="large" />
          <Typography variant="h4" component="h1" sx={{ fontWeight: "bold" }}>
            FinBank
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Personel İşlem Merkezi
        </Typography>

        {/* Giriş / Kayıt Sekmeleri */}
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ width: "100%", mb: 3, borderBottom: 1, borderColor: "divider" }}
        >
          <Tab label="Giriş Yap" />
          <Tab
            label="Yeni Personel"
            icon={<PersonAddAltIcon fontSize="small" />}
            iconPosition="start"
          />
        </Tabs>

        {/* 1. SEKME: GİRİŞ YAP FORMU */}
        {activeTab === 0 && (
          <Box sx={{ width: "100%" }}>
            <LoginForm
              onSubmit={handleLogin}
              isLoading={loading}
              errorMessage={error}
            />
            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1.5 }}>
              <Link
                component="button"
                type="button"
                variant="body2"
                onClick={() => navigate("/forgot-password")}
                sx={{
                  textDecoration: "none",
                  fontWeight: 500,
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                Şifremi unuttum?
              </Link>
            </Box>
          </Box>
        )}

        {/* 2. SEKME: YENİ PERSONEL OLUŞTURMA FORMU */}
        {activeTab === 1 && (
          <Box
            component="form"
            onSubmit={handleRegisterSubmit}
            sx={{ width: "100%" }}
          >
            <TextField
              margin="normal"
              required
              fullWidth
              id="name"
              label="Ad"
              name="name"
              autoFocus
              value={registerForm.name}
              onChange={handleRegisterChange}
              disabled={loading}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              id="surname"
              label="Soyad"
              name="surname"
              value={registerForm.surname}
              onChange={handleRegisterChange}
              disabled={loading}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              id="register-username"
              label="Kullanıcı Adı"
              name="username"
              value={registerForm.username}
              onChange={handleRegisterChange}
              disabled={loading}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              id="register-email"
              label="Kurumsal E-posta"
              name="email"
              type="email"
              value={registerForm.email}
              onChange={handleRegisterChange}
              disabled={loading}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Şifre"
              type="password"
              id="register-password"
              value={registerForm.password}
              onChange={handleRegisterChange}
              disabled={loading}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{ mt: 3, mb: 1, py: 1.2, fontWeight: 600, borderRadius: 2 }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Personel Kaydını Tamamla"
              )}
            </Button>
          </Box>
        )}
      </Paper>

      {/* Bildirimler (Hata ve Başarı Toast Mesajları) */}
      <Snackbar
        open={Boolean(error || successMsg)}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={error ? "error" : "success"}
          variant="filled"
          sx={{ width: "100%", boxShadow: 3 }}
        >
          {error || successMsg}
        </Alert>
      </Snackbar>
    </Container>
  );
};
