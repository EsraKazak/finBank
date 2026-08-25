import React from "react";
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Chip,
  Divider,
  Stack,
} from "@mui/material";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import VpnKeyOutlinedIcon from "@mui/icons-material/VpnKeyOutlined";
import { useAuth } from "../../hooks/useAuth";

export const OverviewPage: React.FC = () => {
  const { user } = useAuth();

  const displayName =
    `${user?.name || ""} ${user?.surname || ""}`.trim() ||
    user?.username ||
    "Kullanıcı";

  const roleLabels: Record<string, string> = {
    YONETICI: "Sistem Yöneticisi",
    SUBE_MUDURU: "Şube Müdürü",
    MUSTERI_ILISKILERI_YONETICISI: "Müşteri İlişkileri Yöneticisi",
    MUSTERI_ILISKILERI_ASISTANI: "Müşteri İlişkileri Asistanı",
    GISE_YETKILISI: "Gişe Yetkilisi",
  };

  const primaryRole: string = Array.isArray(user?.role)
    ? user.role[0] || ""
    : typeof user?.role === "string"
      ? user.role
      : "";

  const userRole =
    (primaryRole && roleLabels[primaryRole]) || primaryRole || "Rol Atanmadı";
  const userPermissions: string[] = user?.permissions || [];

  return (
    <Stack spacing={3}>
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3.5,
          overflow: "hidden",
          border: "1px solid",
          borderColor: "grey.200",
          bgcolor: "#ffffff",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.04)",
        }}
      >
        <Box
          sx={{
            height: 120,
            background:
              "linear-gradient(135deg, #0a192f 0%, #172a45 60%, #1976d2 100%)",
          }}
        />
        <Box sx={{ px: { xs: 2.5, sm: 4 }, pb: 3, pt: 0 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              mt: -6,
              mb: 2.5,
            }}
          >
            <Avatar
              sx={{
                width: 96,
                height: 96,
                bgcolor: "#1976d2",
                border: "4px solid #ffffff",
                boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                fontSize: "2.2rem",
                fontWeight: 700,
              }}
            >
              {displayName.charAt(0).toUpperCase()}
            </Avatar>

            <Chip
              icon={<ShieldOutlinedIcon sx={{ fontSize: 16 }} />}
              label={userRole}
              sx={{
                bgcolor: "#e3f2fd",
                color: "primary.main",
                fontWeight: 700,
                px: 1,
                py: 0.5,
                borderRadius: 2,
              }}
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography
                variant="h5"
                sx={{ fontWeight: 800, color: "#0a192f" }}
              >
                {displayName}
              </Typography>
              <CheckCircleIcon sx={{ color: "primary.main", fontSize: 20 }} />
            </Box>
            {user?.username && (
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", mt: 0.2 }}
              >
                @{user.username}
              </Typography>
            )}
          </Box>

          <Divider sx={{ my: 2.5 }} />

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
            <Box
              sx={{
                flex: "1 1 calc(50% - 16px)",
                minWidth: 220,
                p: 2,
                bgcolor: "#f8fafc",
                borderRadius: 2.5,
                border: "1px solid #edf2f7",
                display: "flex",
                alignItems: "center",
                gap: 1.5,
              }}
            >
              <Box
                sx={{
                  p: 1,
                  borderRadius: 2,
                  bgcolor: "primary.50",
                  color: "primary.main",
                  display: "flex",
                }}
              >
                <EmailOutlinedIcon fontSize="small" />
              </Box>
              <Box>
                <Typography
                  variant="caption"
                  sx={{ color: "text.secondary", display: "block" }}
                >
                  Kurumsal E-posta
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, color: "#0a192f" }}
                >
                  {user?.email || "Belirtilmemiş"}
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                flex: "1 1 calc(50% - 16px)",
                minWidth: 220,
                p: 2,
                bgcolor: "#f8fafc",
                borderRadius: 2.5,
                border: "1px solid #edf2f7",
                display: "flex",
                alignItems: "center",
                gap: 1.5,
              }}
            >
              <Box
                sx={{
                  p: 1,
                  borderRadius: 2,
                  bgcolor: "success.50",
                  color: "success.main",
                  display: "flex",
                }}
              >
                <VpnKeyOutlinedIcon fontSize="small" />
              </Box>
              <Box>
                <Typography
                  variant="caption"
                  sx={{ color: "text.secondary", display: "block" }}
                >
                  Tanımlı Yetki Sayısı
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, color: "success.main" }}
                >
                  {userPermissions.length} Aktif Yetki
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          p: 3.5,
          borderRadius: 3.5,
          border: "1px solid #edf2f7",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.04)",
        }}
      >
        <Typography
          variant="h6"
          sx={{ fontWeight: 800, color: "#0a192f", mb: 1 }}
        >
          Hesabınıza Tanımlı İzinler (Permissions)
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2.5 }}>
          Rolünüzün sağladığı ve bu ekranda işlem yapabileceğiniz yetki listesi:
        </Typography>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {userPermissions.length > 0 ? (
            userPermissions.map((perm) => (
              <Chip
                key={perm}
                label={perm}
                variant="outlined"
                color="primary"
                sx={{
                  fontWeight: 600,
                  bgcolor: "#f0f7ff",
                  borderRadius: 2,
                }}
              />
            ))
          ) : (
            <Typography variant="body2" color="warning.main">
              Hesabınıza henüz bir rol veya izin tanımlanmamıştır.
            </Typography>
          )}
        </Box>
      </Paper>
    </Stack>
  );
};
