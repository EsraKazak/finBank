import {
  Container,
  Card,
  CardContent,
  CardActions,
  Typography,
  Avatar,
  Button,
  Box,
  Divider,
  Chip,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import { useAuth } from "../hooks/useAuth";

export const DashboardPage = () => {
  const { user, logout } = useAuth();

  const displayName = user?.name || user?.email?.split("@")[0] || "Kullanıcı";
  const userRole = user?.role || "Kullanıcı";

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{ fontWeight: "bold" }}
      >
        Dashboard
      </Typography>

      {/* UserCard Tasarımı */}
      <Card
        elevation={3}
        sx={{
          borderRadius: 3,
          overflow: "hidden",
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        {/* Üst Renk Şeridi / Header Banner */}
        <Box
          sx={{
            height: 90,
            bgcolor: "primary.main",
            backgroundImage:
              "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
          }}
        />

        <CardContent sx={{ pt: 0, position: "relative" }}>
          {/* Avatar Bölümü */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              mt: -5,
              mb: 2,
            }}
          >
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: "primary.dark",
                border: "4px solid",
                borderColor: "background.paper",
                boxShadow: 2,
                fontSize: "2rem",
              }}
            >
              {displayName.charAt(0).toUpperCase()}
            </Avatar>
            <Chip
              label={userRole}
              color="primary"
              variant="outlined"
              size="small"
              sx={{ fontWeight: 600 }}
            />
          </Box>

          {/* Kullanıcı Bilgileri */}
          <Typography variant="h5" component="div" sx={{ fontWeight: "bold" }}>
            {displayName}
          </Typography>

          {user?.email && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {user.email}
            </Typography>
          )}

          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Sisteme başarıyla giriş yapıldı. Buradan profil ayarlarını ve hesap
            detaylarını yönetebilirsin.
          </Typography>
        </CardContent>

        <Divider />

        {/* Aksiyonlar */}
        <CardActions
          sx={{ justifyContent: "flex-end", px: 3, py: 2, bgcolor: "grey.50" }}
        >
          <Button
            variant="outlined"
            color="error"
            startIcon={<LogoutIcon />}
            onClick={logout}
            sx={{ borderRadius: 2 }}
          >
            Çıkış Yap
          </Button>
        </CardActions>
      </Card>
    </Container>
  );
};
