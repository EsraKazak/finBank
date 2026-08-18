import React, { useState } from "react";
import { CInput } from "../../components/CInput";
import { CButton } from "../../components/CButton";

interface LoginFormProps {
  onSubmit: (username: string, pass: string) => Promise<void>;
  isLoading: boolean;
  errorMessage: string | null;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  isLoading,
  errorMessage,
}) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(username, password);
  };

  return (
    <form
      onSubmit={handleFormSubmit}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        marginTop: "20px",
        textAlign: "left",
      }}
    >
      <CInput
        label="Kullanıcı Adı"
        type="text"
        placeholder="Örn: ahmet"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />

      <CInput
        label="Şifre"
        type="password"
        placeholder="••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      {errorMessage && (
        <div
          style={{
            color: "#d32f2f",
            fontSize: "14px",
            backgroundColor: "#fde8e8",
            padding: "8px",
            borderRadius: "4px",
          }}
        >
          {errorMessage}
        </div>
      )}

      <CButton type="submit" isLoading={isLoading}>
        {isLoading ? "Giriş Yapılıyor..." : "Giriş Yap"}
      </CButton>
    </form>
  );
};
