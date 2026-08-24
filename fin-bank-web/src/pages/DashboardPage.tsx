import React, { useState } from "react";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  Chip,
  Button,
  Container,
  Paper,
  IconButton,
  Tooltip,
  Stack,
} from "@mui/material";

// İkonlar
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";
import ManageAccountsOutlinedIcon from "@mui/icons-material/ManageAccountsOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import PointOfSaleOutlinedIcon from "@mui/icons-material/PointOfSaleOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import LockClockOutlinedIcon from "@mui/icons-material/LockClockOutlined";
import PolicyOutlinedIcon from "@mui/icons-material/PolicyOutlined";
import LogoutIcon from "@mui/icons-material/Logout";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import VpnKeyOutlinedIcon from "@mui/icons-material/VpnKeyOutlined";

import { useAuth } from "../hooks/useAuth";
import { PersonnelManagement } from "../features/admin/PersonnelManagement";

const DRAWER_WIDTH = 270;

type ActiveTab =
  | "overview"
  | "whitelist"
  | "roles"
  | "customers"
  | "cashier"
  | "approvals"
  | "eod"
  | "audit";

export const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");

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

  // Yetki Kontrol Yardımcısı
  const hasPerm = (perm: string) => userPermissions.includes(perm);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f4f7fb" }}>
      {/* 1. SOL SIDEBAR */}
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
            bgcolor: "#0a192f",
            color: "#ffffff",
            borderRight: "none",
          },
        }}
      >
        {/* Logo */}
        <Box sx={{ p: 2.5, display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            component="img"
            src="/favicon.ico"
            alt="Logo"
            onError={(e: any) => (e.currentTarget.style.display = "none")}
            sx={{ width: 32, height: 32, borderRadius: 1.5 }}
          />
          <Typography
            variant="h6"
            sx={{ fontWeight: 800, color: "#64ffda", letterSpacing: 0.5 }}
          >
            FinBank Portal
          </Typography>
        </Box>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

        {/* Menü Öğeleri */}
        <List sx={{ px: 1.5, py: 2 }}>
          {/* Genel Bakış (Herkese Açık) */}
          <ListItem disablePadding sx={{ mb: 0.8 }}>
            <ListItemButton
              selected={activeTab === "overview"}
              onClick={() => setActiveTab("overview")}
              sx={{
                borderRadius: 2,
                "&.Mui-selected": { bgcolor: "#172a45", color: "#64ffda" },
                "&:hover": { bgcolor: "rgba(255,255,255,0.05)" },
              }}
            >
              <ListItemIcon
                sx={{
                  color: activeTab === "overview" ? "#64ffda" : "grey.400",
                  minWidth: 40,
                }}
              >
                <DashboardOutlinedIcon />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography sx={{ fontSize: "0.9rem", fontWeight: 600 }}>
                    Genel Bakış
                  </Typography>
                }
              />
            </ListItemButton>
          </ListItem>

          {/* YÖNETİCİ MENÜLERİ */}
          {hasPerm("personel:yonetimi") && (
            <>
              <Typography
                variant="caption"
                sx={{
                  px: 2,
                  py: 1,
                  display: "block",
                  color: "grey.500",
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              >
                Personel Yönetimi
              </Typography>

              <ListItem disablePadding sx={{ mb: 0.8 }}>
                <ListItemButton
                  selected={activeTab === "whitelist"}
                  onClick={() => setActiveTab("whitelist")}
                  sx={{
                    borderRadius: 2,
                    "&.Mui-selected": { bgcolor: "#172a45", color: "#64ffda" },
                    "&:hover": { bgcolor: "rgba(255,255,255,0.05)" },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: activeTab === "whitelist" ? "#64ffda" : "grey.400",
                      minWidth: 40,
                    }}
                  >
                    <PersonAddAltOutlinedIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography sx={{ fontSize: "0.9rem", fontWeight: 600 }}>
                        Davet Listesi
                      </Typography>
                    }
                  />
                </ListItemButton>
              </ListItem>

              <ListItem disablePadding sx={{ mb: 0.8 }}>
                <ListItemButton
                  selected={activeTab === "roles"}
                  onClick={() => setActiveTab("roles")}
                  sx={{
                    borderRadius: 2,
                    "&.Mui-selected": { bgcolor: "#172a45", color: "#64ffda" },
                    "&:hover": { bgcolor: "rgba(255,255,255,0.05)" },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: activeTab === "roles" ? "#64ffda" : "grey.400",
                      minWidth: 40,
                    }}
                  >
                    <ManageAccountsOutlinedIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography sx={{ fontSize: "0.9rem", fontWeight: 600 }}>
                        Rol & Yetki Yönetimi
                      </Typography>
                    }
                  />
                </ListItemButton>
              </ListItem>
            </>
          )}

          {/* BANKACILIK & OPERASYON MENÜLERİ (Yetkiye Göre Dinamik Çıkar) */}
          {(hasPerm("musteri:goruntule") ||
            hasPerm("para:yatirma") ||
            hasPerm("islem:limit_ustu:onay") ||
            hasPerm("sube:gun_sonu:kapatma") ||
            hasPerm("denetim:kayit:goruntule")) && (
            <>
              <Typography
                variant="caption"
                sx={{
                  px: 2,
                  py: 1,
                  display: "block",
                  color: "grey.500",
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              >
                Banka Operasyonları
              </Typography>

              {/* Müşteri İşlemleri */}
              {hasPerm("musteri:goruntule") && (
                <ListItem disablePadding sx={{ mb: 0.8 }}>
                  <ListItemButton
                    selected={activeTab === "customers"}
                    onClick={() => setActiveTab("customers")}
                    sx={{
                      borderRadius: 2,
                      "&.Mui-selected": {
                        bgcolor: "#172a45",
                        color: "#64ffda",
                      },
                      "&:hover": { bgcolor: "rgba(255,255,255,0.05)" },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        color:
                          activeTab === "customers" ? "#64ffda" : "grey.400",
                        minWidth: 40,
                      }}
                    >
                      <PeopleAltOutlinedIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography
                          sx={{ fontSize: "0.9rem", fontWeight: 600 }}
                        >
                          Müşteri Yönetimi
                        </Typography>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              )}

              {/* Gişe / Para Yatırma - Çekme */}
              {(hasPerm("para:yatirma") || hasPerm("para:cekme")) && (
                <ListItem disablePadding sx={{ mb: 0.8 }}>
                  <ListItemButton
                    selected={activeTab === "cashier"}
                    onClick={() => setActiveTab("cashier")}
                    sx={{
                      borderRadius: 2,
                      "&.Mui-selected": {
                        bgcolor: "#172a45",
                        color: "#64ffda",
                      },
                      "&:hover": { bgcolor: "rgba(255,255,255,0.05)" },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        color: activeTab === "cashier" ? "#64ffda" : "grey.400",
                        minWidth: 40,
                      }}
                    >
                      <PointOfSaleOutlinedIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography
                          sx={{ fontSize: "0.9rem", fontWeight: 600 }}
                        >
                          Gişe & Kasa İşlemleri
                        </Typography>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              )}

              {/* Limit Üstü Onay (Müdür / Yönetici) */}
              {hasPerm("islem:limit_ustu:onay") && (
                <ListItem disablePadding sx={{ mb: 0.8 }}>
                  <ListItemButton
                    selected={activeTab === "approvals"}
                    onClick={() => setActiveTab("approvals")}
                    sx={{
                      borderRadius: 2,
                      "&.Mui-selected": {
                        bgcolor: "#172a45",
                        color: "#64ffda",
                      },
                      "&:hover": { bgcolor: "rgba(255,255,255,0.05)" },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        color:
                          activeTab === "approvals" ? "#64ffda" : "grey.400",
                        minWidth: 40,
                      }}
                    >
                      <FactCheckOutlinedIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography
                          sx={{ fontSize: "0.9rem", fontWeight: 600 }}
                        >
                          Limit Üstü Onaylar
                        </Typography>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              )}

              {/* Gün Sonu Kapatma */}
              {hasPerm("sube:gun_sonu:kapatma") && (
                <ListItem disablePadding sx={{ mb: 0.8 }}>
                  <ListItemButton
                    selected={activeTab === "eod"}
                    onClick={() => setActiveTab("eod")}
                    sx={{
                      borderRadius: 2,
                      "&.Mui-selected": {
                        bgcolor: "#172a45",
                        color: "#64ffda",
                      },
                      "&:hover": { bgcolor: "rgba(255,255,255,0.05)" },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        color: activeTab === "eod" ? "#64ffda" : "grey.400",
                        minWidth: 40,
                      }}
                    >
                      <LockClockOutlinedIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography
                          sx={{ fontSize: "0.9rem", fontWeight: 600 }}
                        >
                          Gün Sonu Kapatma
                        </Typography>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              )}

              {/* Denetim Kayıtları (Loglar) */}
              {hasPerm("denetim:kayit:goruntule") && (
                <ListItem disablePadding sx={{ mb: 0.8 }}>
                  <ListItemButton
                    selected={activeTab === "audit"}
                    onClick={() => setActiveTab("audit")}
                    sx={{
                      borderRadius: 2,
                      "&.Mui-selected": {
                        bgcolor: "#172a45",
                        color: "#64ffda",
                      },
                      "&:hover": { bgcolor: "rgba(255,255,255,0.05)" },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        color: activeTab === "audit" ? "#64ffda" : "grey.400",
                        minWidth: 40,
                      }}
                    >
                      <PolicyOutlinedIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography
                          sx={{ fontSize: "0.9rem", fontWeight: 600 }}
                        >
                          Denetim İzleri (Logs)
                        </Typography>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              )}
            </>
          )}
        </List>

        {/* Sidebar Alt Profil */}
        <Box sx={{ mt: "auto", p: 2, bgcolor: "rgba(0,0,0,0.2)" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Avatar
              sx={{
                width: 36,
                height: 36,
                bgcolor: "#1976d2",
                fontWeight: 700,
              }}
            >
              {displayName.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ overflow: "hidden" }}>
              <Typography
                variant="body2"
                noWrap
                sx={{ fontWeight: 700, color: "#fff" }}
              >
                {displayName}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "grey.400", display: "block" }}
              >
                {userRole}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Drawer>

      {/* 2. SAĞ İÇERİK ALANI */}
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <AppBar
          position="static"
          elevation={0}
          sx={{ bgcolor: "#ffffff", borderBottom: "1px solid #e2e8f0" }}
        >
          <Toolbar sx={{ justifyContent: "space-between" }}>
            <Typography variant="h6" sx={{ color: "#0a192f", fontWeight: 700 }}>
              {activeTab === "overview" && "Genel Bakış"}
              {activeTab === "whitelist" && "Beyaz Liste Personel Daveti"}
              {activeTab === "roles" && "Personel & Rol Yönetimi"}
              {activeTab === "customers" && "Müşteri ve Hesap Yönetimi"}
              {activeTab === "cashier" && "Gişe Para Yatırma / Çekme"}
              {activeTab === "approvals" && "Limit Üstü İşlem Onayları"}
              {activeTab === "eod" && "Şube Gün Sonu Kapatma"}
              {activeTab === "audit" && "Denetim ve Log Kayıtları"}
            </Typography>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
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
                sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
              >
                Çıkış
              </Button>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Dinamik Sayfa İçerikleri */}
        <Container maxWidth="lg" sx={{ py: 4, flexGrow: 1 }}>
          {/* GENEL BAKIŞ & YETKİ ROZETLERİ */}
          {activeTab === "overview" && (
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
                      <CheckCircleIcon
                        sx={{ color: "primary.main", fontSize: 20 }}
                      />
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

              {/* SAHİP OLUNAN ATOMİK İZİNLER ROZET ALANI */}
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
                <Typography
                  variant="body2"
                  sx={{ color: "text.secondary", mb: 2.5 }}
                >
                  Rolünüzün sağladığı ve bu ekranda işlem yapabileceğiniz yetki
                  listesi:
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
          )}

          {/* YÖNETİCİ SEKMELERİ */}
          {activeTab === "whitelist" && hasPerm("personel:yonetimi") && (
            <PersonnelManagement viewMode="whitelist" />
          )}

          {activeTab === "roles" && hasPerm("personel:yonetimi") && (
            <PersonnelManagement viewMode="roles" />
          )}

          {/* DİĞER MODÜLLER İÇİN YER TUTUCU SAYFALAR */}
          {activeTab === "customers" && hasPerm("musteri:goruntule") && (
            <Paper
              elevation={0}
              sx={{ p: 4, borderRadius: 3.5, border: "1px solid #e2e8f0" }}
            >
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                Müşteri Portföyü ve Hesap Listesi
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Müşteri hesapları ve bakiye detayları burada listelenecektir.
              </Typography>
            </Paper>
          )}

          {activeTab === "cashier" &&
            (hasPerm("para:yatirma") || hasPerm("para:cekme")) && (
              <Paper
                elevation={0}
                sx={{ p: 4, borderRadius: 3.5, border: "1px solid #e2e8f0" }}
              >
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                  Gişe Para Yatırma & Çekme Ekranı
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  Hesaplar arası para transferi ve nakit hareketleri
                  operasyonları.
                </Typography>
              </Paper>
            )}

          {activeTab === "approvals" && hasPerm("islem:limit_ustu:onay") && (
            <Paper
              elevation={0}
              sx={{ p: 4, borderRadius: 3.5, border: "1px solid #e2e8f0" }}
            >
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                Limit Üstü İşlem Onay Masası
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Gişe yetkililerinin gönderdiği 50.000 TL üstü transfer onayları.
              </Typography>
            </Paper>
          )}

          {activeTab === "eod" && hasPerm("sube:gun_sonu:kapatma") && (
            <Paper
              elevation={0}
              sx={{ p: 4, borderRadius: 3.5, border: "1px solid #e2e8f0" }}
            >
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                Şube Gün Sonu Kapanış ve Kasa Mutabakatı
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Günlük şube kasa bakiyelerini doğrulayıp günü kapatma paneli.
              </Typography>
            </Paper>
          )}

          {activeTab === "audit" && hasPerm("denetim:kayit:goruntule") && (
            <Paper
              elevation={0}
              sx={{ p: 4, borderRadius: 3.5, border: "1px solid #e2e8f0" }}
            >
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                Denetim İzleri ve Sistem Logları
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Sistemde yapılan tüm işlemlerin log geçmişi.
              </Typography>
            </Paper>
          )}
        </Container>
      </Box>
    </Box>
  );
};
