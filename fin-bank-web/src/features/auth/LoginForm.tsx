import React, { useState } from "react";
import { Box, TextField, Button, Alert, CircularProgress } from "@mui/material";
import { InputAdornment, IconButton } from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

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

  const [showPassword, setShowPassword] = useState(false);

  const handleTogglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  // Butona tıklandığında input odağının kaybolmaması için:
  const handleMouseDownPassword = (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
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
        name="password"
        type={showPassword ? "text" : "password"}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        fullWidth
        required
        autoComplete="current-password"
        disabled={isLoading}
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="şifre görünürlüğünü değiştir"
                  onClick={handleTogglePasswordVisibility}
                  onMouseDown={handleMouseDownPassword}
                  edge="end"
                  size="small"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
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
