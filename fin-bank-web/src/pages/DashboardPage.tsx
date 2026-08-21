import {
  Container,
  Paper,
  Typography,
  Avatar,
  Button,
  Box,
  Divider,
  Chip,
  AppBar,
  Toolbar,
  IconButton,
  Tooltip,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useAuth } from "../hooks/useAuth";

export const DashboardPage = () => {
  const { user, logout } = useAuth();

  const displayName =
    `${user?.name || ""} ${user?.surname || ""}`.trim() ||
    user?.username ||
    user?.email?.split("@")[0] ||
    "Kullanıcı";

  const roleLabels: Record<string, string> = {
    BANKO_ASISTANI: "Banko Asistanı",
    ADMIN: "Sistem Yöneticisi",
  };

  const userRole =
    (user?.role && roleLabels[user.role]) || user?.role || "Banka Personeli";

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f4f7fb" }}>
      {/* Üst Navigasyon Çubuğu */}
      <AppBar
        position="static"
        elevation={0}
        sx={{
          bgcolor: "#ffffff",
          borderBottom: "1px solid",
          borderColor: "grey.200",
          color: "text.primary",
        }}
      >
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              component="img"
              src="/favicon.ico"
              alt="FinBank Logo"
              onError={(e: any) => {
                e.currentTarget.style.display = "none";
              }}
              sx={{ width: 34, height: 34, borderRadius: 1.5 }}
            />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                background: "linear-gradient(45deg, #0a192f 30%, #1976d2 90%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              FinBank Portal
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Tooltip title="Bildirimler">
              <IconButton size="small" sx={{ color: "text.secondary" }}>
                <NotificationsNoneOutlinedIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<LogoutIcon />}
              onClick={logout}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                borderColor: "grey.300",
                "&:hover": { borderColor: "error.main", bgcolor: "error.50" },
              }}
            >
              Çıkış
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 5 }}>
        {/* Karşılama Başlığı */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: "#0a192f" }}>
            Hoş Geldiniz, {user?.name || displayName} 👋
          </Typography>
          <Typography variant="body1" sx={{ color: "text.secondary", mt: 0.5 }}>
            Personel işlem ve yönetim paneline genel bakış.
          </Typography>
        </Box>

        {/* Ana Profil Kartı */}
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
          {/* Gradyan Banner */}
          <Box
            sx={{
              height: 120,
              background:
                "linear-gradient(135deg, #0a192f 0%, #172a45 60%, #1976d2 100%)",
            }}
          />

          <Box sx={{ px: { xs: 2.5, sm: 4 }, pb: 3, pt: 0 }}>
            {/* Avatar & Rol Rozeti */}
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

            {/* İsim ve Kullanıcı Bilgisi */}
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

            {/* Bilgi Rozetleri / Mini Detaylar */}
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 2,
              }}
            >
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
                  <AccountBalanceWalletOutlinedIcon fontSize="small" />
                </Box>
                <Box>
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary", display: "block" }}
                  >
                    Yetki Durumu
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 600, color: "success.main" }}
                  >
                    Aktif / Doğrulanmış
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};
