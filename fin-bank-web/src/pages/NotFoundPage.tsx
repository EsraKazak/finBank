// src/pages/NotFoundPage.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { Container, Box, Typography, Button, Paper } from "@mui/material";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined";

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container
      maxWidth="sm"
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        py: 4,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: { xs: 3, sm: 5 },
          borderRadius: 4,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
          width: "100%",
        }}
      >
        <Box
          sx={{
            display: "inline-flex",
            p: 2,
            borderRadius: "50%",
            bgcolor: "error.light",
            color: "error.contrastText",
            mb: 1,
          }}
        >
          <ErrorOutlineOutlinedIcon sx={{ fontSize: 48 }} />
        </Box>

        <Typography
          variant="h1"
          component="h1"
          sx={{
            fontWeight: 800,
            fontSize: { xs: "4rem", sm: "6rem" },
            lineHeight: 1,
            color: "primary.main",
            letterSpacing: -1,
          }}
        >
          404
        </Typography>

        <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
          Sayfa Bulunamadı
        </Typography>

        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ maxWidth: 420 }}
        >
          Aradığınız sayfa silinmiş, adı değiştirilmiş veya geçici olarak
          kullanım dışı kalmış olabilir.
        </Typography>

        <Button
          variant="contained"
          size="large"
          startIcon={<HomeOutlinedIcon />}
          onClick={() => navigate("/dashboard", { replace: true })}
          sx={{
            mt: 2,
            px: 4,
            py: 1.2,
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
          }}
        >
          Ana Sayfaya Dön
        </Button>
      </Paper>
    </Container>
  );
};
