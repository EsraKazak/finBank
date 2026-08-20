import React, { useState, useEffect } from "react";
import { Paper, Typography, Button, Box, Slide } from "@mui/material";
import CookieOutlinedIcon from "@mui/icons-material/CookieOutlined";

export const CookieBanner: React.FC = () => {
  const [open, setOpen] = useState<boolean>(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) {
      setOpen(true);
    }
  }, []);

  const handleAcceptNecessaryOnly = () => {
    localStorage.setItem("cookie_consent", "necessary_only");
    setOpen(false);
  };

  const handleAcceptAll = () => {
    localStorage.setItem("cookie_consent", "all");
    setOpen(false);
  };

  if (!open) return null;

  return (
    <Slide direction="up" in={open} mountOnEnter unmountOnExit>
      <Paper
        elevation={10}
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          py: 1.2,
          px: { xs: 2, md: 4 },
          bgcolor: "grey.900",
          color: "grey.100",
          borderRadius: 0,
          borderTop: "1px solid",
          borderColor: "grey.800",
        }}
      >
        <Box
          sx={{
            maxWidth: 1200,
            mx: "auto",
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1.5,
          }}
        >
          {/* Metin ve İkon Kısmı */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              textAlign: { xs: "center", sm: "left" },
            }}
          >
            <CookieOutlinedIcon sx={{ color: "primary.light", fontSize: 22 }} />
            <Typography
              variant="caption"
              sx={{ color: "grey.300", lineHeight: 1.4 }}
            >
              FinBank Portalı'nda güvenli oturum ve bankacılık işlemleri için{" "}
              <strong>zorunlu teknik çerezler</strong> kullanılmaktadır.
            </Typography>
          </Box>

          {/* Butonlar */}
          <Box
            sx={{
              display: "flex",
              gap: 1,
              flexShrink: 0,
              width: { xs: "100%", sm: "auto" },
              justifyContent: "flex-end",
            }}
          >
            <Button
              size="small"
              variant="outlined"
              onClick={handleAcceptNecessaryOnly}
              sx={{
                color: "grey.300",
                borderColor: "grey.700",
                textTransform: "none",
                fontSize: "0.75rem",
                py: 0.4,
                px: 1.5,
                borderRadius: 1.5,
                "&:hover": {
                  borderColor: "grey.500",
                  bgcolor: "rgba(255,255,255,0.05)",
                },
              }}
            >
              Yalnızca Zorunlular
            </Button>

            <Button
              size="small"
              variant="contained"
              color="primary"
              onClick={handleAcceptAll}
              sx={{
                textTransform: "none",
                fontSize: "0.75rem",
                py: 0.4,
                px: 2,
                borderRadius: 1.5,
                fontWeight: 600,
              }}
            >
              Tümünü Kabul Et
            </Button>
          </Box>
        </Box>
      </Paper>
    </Slide>
  );
};
