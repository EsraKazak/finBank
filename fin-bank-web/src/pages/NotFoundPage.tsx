// src/pages/NotFoundPage.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Button, Paper } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SearchOffIcon from "@mui/icons-material/SearchOff";

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, #0a192f 0%, #172a45 50%, #0d2538 100%)",
        p: 2,
      }}
    >
      <Paper
        elevation={12}
        sx={{
          width: "100%",
          maxWidth: 480,
          p: { xs: 3.5, sm: 5 },
          borderRadius: 4,
          backgroundColor: "rgba(255, 255, 255, 0.96)",
          backdropFilter: "blur(12px)",
          boxShadow: "0 20px 45px rgba(0, 0, 0, 0.35)",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* İkon Rozeti */}
        <Box
          sx={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)",
            color: "primary.main",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mb: 2,
            boxShadow: "0 8px 20px rgba(25, 118, 210, 0.15)",
          }}
        >
          <SearchOffIcon sx={{ fontSize: 38 }} />
        </Box>

        {/* 404 Sayısal Başlık */}
        <Typography
          variant="h1"
          component="h1"
          sx={{
            fontWeight: 900,
            fontSize: { xs: "4.5rem", sm: "6rem" },
            lineHeight: 1,
            letterSpacing: "-2px",
            background: "linear-gradient(45deg, #0a192f 30%, #1976d2 90%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            mb: 1,
          }}
        >
          404
        </Typography>

        <Typography
          variant="h5"
          component="h2"
          sx={{ fontWeight: 800, color: "#0a192f", mb: 1 }}
        >
          Sayfa Bulunamadı
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: "text.secondary",
            maxWidth: 360,
            lineHeight: 1.6,
            mb: 3.5,
          }}
        >
          Aradığınız sayfa silinmiş, taşınmış veya geçici olarak erişime
          kapatılmış olabilir.
        </Typography>

        {/* Buton Aksiyon Grubu */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: 1.5,
            width: "100%",
          }}
        >
          <Button
            variant="outlined"
            fullWidth
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            sx={{
              py: 1.2,
              borderRadius: 2.5,
              textTransform: "none",
              fontWeight: 700,
              color: "#0a192f",
              borderColor: "grey.300",
              "&:hover": {
                borderColor: "primary.main",
                bgcolor: "grey.50",
              },
            }}
          >
            Geri Dön
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};
