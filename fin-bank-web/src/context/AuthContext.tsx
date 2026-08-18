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

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    setUser(null);
    setAccessToken(null);
  };

  const login = (data: AuthResponse) => {
    localStorage.setItem("accessToken", data.accessToken);
    if (data.refreshToken) {
      localStorage.setItem("refreshToken", data.refreshToken);
    }
    localStorage.setItem("user", JSON.stringify(data.user));

    setAccessToken(data.accessToken);
    setUser(data.user);
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem("accessToken");
      const storedRefreshToken = localStorage.getItem("refreshToken");

      // Hafızada hiçbir token yoksa direkt kontrolü bitir
      if (!storedToken && !storedRefreshToken) {
        setIsLoading(false);
        return;
      }

      try {
        // Sunucuya gerçek bir doğrulama isteği atıyoruz.
        // Access Token süresi bitmişse api interceptor'ı refresh token ile sessizce yenileyecektir.
        const response = await api.get<{ user: User }>("/auth/me");

        setUser(response.data.user);
        setAccessToken(localStorage.getItem("accessToken"));
      } catch (error) {
        // Hem access token hem refresh token geçersizse oturumu tamamen kapat
        console.warn("Oturum doğrulanamadı, çıkış yapılıyor.");
        logout();
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
