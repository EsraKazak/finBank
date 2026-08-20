// src/context/AuthContext.tsx
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
  // 1. İLK RENDER ANINDA DOĞRUDAN LOCALSTORAGE'DAN OKU (Yarış durumunu önler)
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem("user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [accessToken, setAccessToken] = useState<string | null>(() => {
    return localStorage.getItem("accessToken");
  });

  // Token varsa doğrulama tamamlanana kadar isLoading true kalsın
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    return !!localStorage.getItem("accessToken");
  });

  // GİRİŞ YAPMA
  const login = async (username: string, pass: string): Promise<void> => {
    const response = await api.post<AuthResponse>("/auth/login", {
      username,
      password: pass,
    });

    const data = response.data as any;

    const resolvedUser: User = data.user ||
      data.data?.user ||
      (data.id ? (data as User) : null) || {
        id: "1",
        username,
        name: username,
        surname: "",
        role: "BANKO_ASISTANI",
      };

    if (data.accessToken) {
      localStorage.setItem("accessToken", data.accessToken);
      setAccessToken(data.accessToken);
    }
    if (data.refreshToken) {
      localStorage.setItem("refreshToken", data.refreshToken);
    }

    localStorage.setItem("user", JSON.stringify(resolvedUser));
    setUser(resolvedUser);
  };

  // ÇIKIŞ YAPMA
  // Çıkış işleminde sadece logout endpoint'ini çağırmak yeterlidir:
  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.warn("Backend çıkış isteğinde hata:", error);
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      setUser(null);
      setAccessToken(null);
    }
  };

  // SAYFA YENİLENDİĞİNDE ARKA PLANDA TOKEN DOĞRULAMA
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem("accessToken");

      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.get<{ user: User }>("/auth/me");
        const currentUser = response.data.user || (response.data as any);
        setUser(currentUser);
        localStorage.setItem("user", JSON.stringify(currentUser));
      } catch (error) {
        console.warn("Oturum doğrulanamadı, yerel veriler temizleniyor.");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
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
