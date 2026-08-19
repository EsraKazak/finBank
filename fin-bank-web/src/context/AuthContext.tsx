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
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 1. GİRİŞ YAPMA (API isteği + State + LocalStorage)
  const login = async (username: string, pass: string): Promise<void> => {
    const response = await api.post<AuthResponse>("/auth/login", {
      username,
      password: pass,
    });

    console.log("Backend Giriş Yanıtı:", response.data);

    const data = response.data as any;

    // Backend yanıtındaki kullanıcı nesnesini yakala
    const resolvedUser: User = data.user ||
      data.data?.user ||
      (data.id ? (data as User) : null) || {
        id: "1",
        username,
        name: username,
        surname: "",
      };

    // Token ve kullanıcı verilerini sakla
    if (data.accessToken) {
      localStorage.setItem("accessToken", data.accessToken);
      setAccessToken(data.accessToken);
    }
    if (data.refreshToken) {
      localStorage.setItem("refreshToken", data.refreshToken);
    }

    localStorage.setItem("user", JSON.stringify(resolvedUser));

    // State'i güncelle
    setUser(resolvedUser);
  };

  // 2. ÇIKIŞ YAPMA (Backend bildirimi + LocalStorage ve State temizliği)
  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        await api.post("/auth/logout", { refreshToken });
      }
    } catch (error) {
      console.warn("Backend çıkış isteğinde hata:", error);
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      setUser(null);
      setAccessToken(null);
    }
  };

  // 3. OTURUM BAŞLATMA (Sayfa F5 yapıldığında)
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem("accessToken");
      const storedRefreshToken = localStorage.getItem("refreshToken");
      const storedUser = localStorage.getItem("user");

      if (!storedToken && !storedRefreshToken) {
        setIsLoading(false);
        return;
      }

      // LocalStorage'da kayıtlı kullanıcı varsa hemen yükle (hızlı açılış)
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          // JSON parse hatası olursa yok say
        }
      }

      if (storedToken) {
        setAccessToken(storedToken);
      }

      // Backend üzerinden token geçerliliğini doğrula
      try {
        const response = await api.get<{ user: User }>("/auth/me");
        const currentUser = response.data.user || (response.data as any);
        setUser(currentUser);
        localStorage.setItem("user", JSON.stringify(currentUser));
      } catch (error) {
        console.warn("Oturum doğrulanamadı, yerel veriler temizleniyor.");
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
