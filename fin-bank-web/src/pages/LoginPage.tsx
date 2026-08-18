import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../services/api";
import { LoginForm } from "../features/auth/LoginForm";
import { useAuth } from "../hooks/useAuth";

export const LoginPage: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (username: string, pass: string) => {
    setError(null);
    setLoading(true);
    try {
      // 1. API'den veriyi al
      const data = await loginUser(username, pass);

      // 2. AuthContext'teki login metodunu çalıştır (state ve localStorage'ı o günceller)
      // data içinde { accessToken, user, (varsa refreshToken) } döndüğünden emin ol
      login(data);

      // 3. Kullanıcıyı Dashboard sayfasına yönlendir
      // replace: true sayesinde kullanıcı tarayıcının "Geri" butonuna bastığında tekrar login sayfasına dönmez
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

  return (
    <div
      style={{
        maxWidth: "400px",
        margin: "80px auto",
        padding: "30px",
        borderRadius: "12px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        backgroundColor: "#ffffff",
        color: "#333333",
        fontFamily: "sans-serif",
      }}
    >
      <h2 style={{ textAlign: "center", color: "#1976d2" }}>FinBank</h2>

      <LoginForm
        onSubmit={handleLogin}
        isLoading={loading}
        errorMessage={error}
      />
    </div>
  );
};
