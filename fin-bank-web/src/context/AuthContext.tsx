import React, { createContext, useState, useEffect } from "react";
import {
  type User,
  type AuthResponse,
  type AuthContextType,
} from "../types/auth.types";
import api from "../services/api";

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 1. GİRİŞ YAPMA (API isteği + State + LocalStorage)
  const login = async (username: string, pass: string): Promise<void> => {
    // API isteğini doğrudan context içinde yapıyoruz
    const response = await api.post<AuthResponse>("/auth/login", {
      username,
      password: pass,
    });
    console.log("Backend Giriş Yanıtı:", response.data); // Gelen veriyi gör

    const data = response.data;

    // Token ve kullanıcı verilerini sakla
    localStorage.setItem("accessToken", data.accessToken);
    if (data.refreshToken) {
      localStorage.setItem("refreshToken", data.refreshToken);
    }
    localStorage.setItem("user", JSON.stringify(data.user));

    // State'i güncelle
    setAccessToken(data.accessToken);
    setUser(data.user);
  };

  // 2. ÇIKIŞ YAPMA (Backend'i bilgilendir + LocalStorage ve State temizliği)
  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        // Backend'e token'ı geçersiz kılması için bildirim atıyoruz (varsa)
        await api.post("/auth/logout", { refreshToken });
      }
    } catch (error) {
      console.warn("Backend çıkış isteğinde hata:", error);
    } finally {
      // Hata alsa bile istemcideki tüm oturumu temizle
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      setUser(null);
      setAccessToken(null);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem("accessToken");
      const storedRefreshToken = localStorage.getItem("refreshToken");

      if (!storedToken && !storedRefreshToken) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.get<{ user: User }>("/auth/me");
        setUser(response.data.user);
        setAccessToken(localStorage.getItem("accessToken"));
      } catch (error) {
        console.warn("Oturum doğrulanamadı, çıkış yapılıyor.");
        // Sessiz temizlik
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        setUser(null);
        setAccessToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
