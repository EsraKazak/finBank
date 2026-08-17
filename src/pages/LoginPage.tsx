import React, { useState } from "react";
import { loginUser, type LoginResponse } from "../services/api";
import { LoginForm } from "../features/auth/LoginForm";
import { UserCard } from "../features/transfer/UserCard";

export const LoginPage: React.FC = () => {
  //kullanıcın giriş yapıp yapmadığını kontrol etmek için state
  const [loggedInUser, setLoggedInUser] = useState<
    LoginResponse["user"] | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (username: string, pass: string) => {
    setError(null);
    setLoading(true);
    try {
      const data = await loginUser(username, pass);
      localStorage.setItem("authToken", data.token);
      setLoggedInUser(data.user);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Giriş yapılamadı. Bilgilerinizi kontrol edin.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    setLoggedInUser(null);
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

      {loggedInUser ? (
        <UserCard user={loggedInUser} onLogout={handleLogout} />
      ) : (
        <LoginForm
          onSubmit={handleLogin}
          isLoading={loading}
          errorMessage={error}
        />
      )}
    </div>
  );
};
