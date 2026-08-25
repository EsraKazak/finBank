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

  // SAYFA AÇILDIĞINDA VEYA YENİLENDİĞİNDE OTURUMU DOĞRULA
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem("accessToken");

      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        setAccessToken(storedToken);
        const response = await api.get<{ user: User }>("/auth/me");
        const currentUser =
          (response.data as any).data?.user ||
          (response.data as any).data ||
          response.data.user ||
          response.data;

        setUser(currentUser);
        localStorage.setItem("user", JSON.stringify(currentUser));
      } catch (error) {
        console.warn("Geçersiz oturum, yerel veriler temizleniyor.");
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
  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.warn("Backend çıkış isteğinde hata:", error);
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      setUser(null);
      setAccessToken(null);
      window.location.href = "/login";
    }
  };

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
