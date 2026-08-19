import React, { useState } from "react";
import { Box, TextField, Button, Alert, CircularProgress } from "@mui/material";

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
    console.log("1. Form submit tetiklendi:", { username, password });
    await onSubmit(username, password);
  };

  return (
    <Box
      component="form"
      onSubmit={handleFormSubmit}
      noValidate
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        mt: 2.5,
        width: "100%",
      }}
    >
      <TextField
        label="Kullanıcı Adı"
        variant="outlined"
        fullWidth
        required
        placeholder="Örn: ahmet"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        disabled={isLoading}
        autoComplete="username"
      />

      <TextField
        label="Şifre"
        type="password"
        variant="outlined"
        fullWidth
        required
        placeholder="••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={isLoading}
        autoComplete="current-password"
      />

      {errorMessage && (
        <Alert severity="error" variant="filled">
          {errorMessage}
        </Alert>
      )}

      <Button
        type="submit"
        variant="contained"
        size="large"
        fullWidth
        disabled={isLoading}
        startIcon={
          isLoading ? <CircularProgress size={20} color="inherit" /> : null
        }
      >
        {isLoading ? "Giriş Yapılıyor..." : "Giriş Yap"}
      </Button>
    </Box>
  );
};
