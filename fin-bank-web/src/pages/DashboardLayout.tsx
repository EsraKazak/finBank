import React, { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
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
  Button,
  Container,
  IconButton,
  Tooltip,
  Collapse,
} from "@mui/material";

import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
// İkonlar
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";
import ManageAccountsOutlinedIcon from "@mui/icons-material/ManageAccountsOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import PointOfSaleOutlinedIcon from "@mui/icons-material/PointOfSaleOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import LockClockOutlinedIcon from "@mui/icons-material/LockClockOutlined";
import PolicyOutlinedIcon from "@mui/icons-material/PolicyOutlined";
import LogoutIcon from "@mui/icons-material/Logout";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

import { useAuth } from "../hooks/useAuth";

const DRAWER_EXPANDED = 260;
const DRAWER_COLLAPSED = 72;

export const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  //vadeli menüsü için hangisinin açık olduğunu kontrol etmek için state
  const [timeMenuOpen, setTimeMenuOpen] = useState(
    location.pathname.startsWith("/dashboard/time-accounts"),
  );

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
  const hasPerm = (perm: string) => userPermissions.includes(perm);

  // Başlık belirleme
  const getPageTitle = () => {
    const path = location.pathname;

    if (path === "/dashboard") return "Genel Bakış";
    if (path.startsWith("/dashboard/whitelist"))
      return "Beyaz Liste Personel Daveti";
    if (path.startsWith("/dashboard/roles")) return "Personel & Rol Yönetimi";
    if (path.startsWith("/dashboard/customers"))
      return "Müşteri ve Hesap Yönetimi";
    if (path.startsWith("/dashboard/cashier"))
      return "Gişe Para Yatırma / Çekme";
    if (path.startsWith("/dashboard/approvals"))
      return "Limit Üstü İşlem Onayları";
    if (path.startsWith("/dashboard/eod")) return "Şube Gün Sonu Kapatma";
    if (path.startsWith("/dashboard/audit")) return "Denetim ve Log Kayıtları";
    if (path.startsWith("/dashboard/demand-accounts"))
      return "Vadesiz Hesap Yönetimi";
    if (path.startsWith("/dashboard/time-accounts"))
      return "Vadeli Hesap İşlemleri";
    if (path === "/dashboard/time-accounts/update")
      return "Vadeli Hesap Vade & Temdit Güncelleme";

    return "FinBank Portal";
  };

  const currentWidth = open ? DRAWER_EXPANDED : DRAWER_COLLAPSED;

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f4f7fb" }}>
      {/* 1. SOL COLLAPSIBLE SIDEBAR */}
      <Drawer
        variant="permanent"
        sx={{
          width: currentWidth,
          flexShrink: 0,
          whiteSpace: "nowrap",
          boxSizing: "border-box",
          "& .MuiDrawer-paper": {
            width: currentWidth,
            transition: "width 0.22s ease-in-out",
            overflowX: "hidden",
            bgcolor: "#0a192f",
            color: "#ffffff",
            borderRight: "none",
          },
        }}
      >
        {/* Logo & Toggle */}
        <Box
          sx={{
            p: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: open ? "space-between" : "center",
            minHeight: 64,
          }}
        >
          {open && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box
                component="img"
                src="/favicon.ico"
                alt="Logo"
                onError={(e: any) => (e.currentTarget.style.display = "none")}
                sx={{ width: 30, height: 30, borderRadius: 1.5 }}
              />
              <Typography
                variant="h6"
                sx={{ fontWeight: 800, color: "#64ffda", fontSize: "1.05rem" }}
              >
                FinBank Portal
              </Typography>
            </Box>
          )}

          <IconButton
            onClick={() => setOpen(!open)}
            sx={{ color: "#64ffda" }}
            size="small"
          >
            {open ? <ChevronLeftIcon /> : <MenuIcon />}
          </IconButton>
        </Box>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

        {/* Menü Listesi */}
        <List sx={{ px: 1, py: 2 }}>
          {/* Genel Bakış */}
          <Tooltip title={!open ? "Genel Bakış" : ""} placement="right">
            <ListItem disablePadding sx={{ mb: 0.8 }}>
              <ListItemButton
                selected={location.pathname === "/dashboard"}
                onClick={() => navigate("/dashboard")}
                sx={{
                  borderRadius: 2,
                  justifyContent: open ? "initial" : "center",
                  px: 2,
                  "&.Mui-selected": { bgcolor: "#172a45", color: "#64ffda" },
                  "&:hover": { bgcolor: "rgba(255,255,255,0.05)" },
                }}
              >
                <ListItemIcon
                  sx={{
                    color:
                      location.pathname === "/dashboard"
                        ? "#64ffda"
                        : "grey.400",
                    minWidth: open ? 40 : "auto",
                    mr: open ? 1 : "auto",
                  }}
                >
                  <DashboardOutlinedIcon />
                </ListItemIcon>
                {open && (
                  <ListItemText
                    primary={
                      <Typography sx={{ fontSize: "0.88rem", fontWeight: 600 }}>
                        Genel Bakış
                      </Typography>
                    }
                  />
                )}
              </ListItemButton>
            </ListItem>
          </Tooltip>

          {/* YÖNETİCİ MENÜLERİ */}
          {hasPerm("personel:yonetimi") && (
            <>
              {open && (
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
              )}

              <Tooltip title={!open ? "Davet Listesi" : ""} placement="right">
                <ListItem disablePadding sx={{ mb: 0.8 }}>
                  <ListItemButton
                    selected={location.pathname.startsWith(
                      "/dashboard/whitelist",
                    )}
                    onClick={() => navigate("/dashboard/whitelist")}
                    sx={{
                      borderRadius: 2,
                      justifyContent: open ? "initial" : "center",
                      px: 2,
                      "&.Mui-selected": {
                        bgcolor: "#172a45",
                        color: "#64ffda",
                      },
                      "&:hover": { bgcolor: "rgba(255,255,255,0.05)" },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        color: location.pathname.startsWith(
                          "/dashboard/whitelist",
                        )
                          ? "#64ffda"
                          : "grey.400",
                        minWidth: open ? 40 : "auto",
                        mr: open ? 1 : "auto",
                      }}
                    >
                      <PersonAddAltOutlinedIcon />
                    </ListItemIcon>
                    {open && (
                      <ListItemText
                        primary={
                          <Typography
                            sx={{ fontSize: "0.88rem", fontWeight: 600 }}
                          >
                            Davet Listesi
                          </Typography>
                        }
                      />
                    )}
                  </ListItemButton>
                </ListItem>
              </Tooltip>

              <Tooltip
                title={!open ? "Rol & Yetki Yönetimi" : ""}
                placement="right"
              >
                <ListItem disablePadding sx={{ mb: 0.8 }}>
                  <ListItemButton
                    selected={location.pathname.startsWith("/dashboard/roles")}
                    onClick={() => navigate("/dashboard/roles")}
                    sx={{
                      borderRadius: 2,
                      justifyContent: open ? "initial" : "center",
                      px: 2,
                      "&.Mui-selected": {
                        bgcolor: "#172a45",
                        color: "#64ffda",
                      },
                      "&:hover": { bgcolor: "rgba(255,255,255,0.05)" },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        color: location.pathname.startsWith("/dashboard/roles")
                          ? "#64ffda"
                          : "grey.400",
                        minWidth: open ? 40 : "auto",
                        mr: open ? 1 : "auto",
                      }}
                    >
                      <ManageAccountsOutlinedIcon />
                    </ListItemIcon>
                    {open && (
                      <ListItemText
                        primary={
                          <Typography
                            sx={{ fontSize: "0.88rem", fontWeight: 600 }}
                          >
                            Rol & Yetki Yönetimi
                          </Typography>
                        }
                      />
                    )}
                  </ListItemButton>
                </ListItem>
              </Tooltip>
            </>
          )}

          {/* BANKA OPERASYONLARI */}
          {(hasPerm("musteri:goruntule") ||
            hasPerm("para:yatirma") ||
            hasPerm("islem:limit_ustu:onay") ||
            hasPerm("sube:gun_sonu:kapatma") ||
            hasPerm("denetim:kayit:goruntule")) && (
            <>
              {open && (
                <Typography
                  variant="caption"
                  sx={{
                    px: 2,
                    py: 1,
                    display: "block",
                    color: "grey.500",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    mt: 1,
                  }}
                >
                  Banka Operasyonları
                </Typography>
              )}

              {hasPerm("musteri:goruntule") && (
                <Tooltip
                  title={!open ? "Müşteri Yönetimi" : ""}
                  placement="right"
                >
                  <ListItem disablePadding sx={{ mb: 0.8 }}>
                    <ListItemButton
                      selected={location.pathname.startsWith(
                        "/dashboard/customers",
                      )}
                      onClick={() => navigate("/dashboard/customers")}
                      sx={{
                        borderRadius: 2,
                        justifyContent: open ? "initial" : "center",
                        px: 2,
                        "&.Mui-selected": {
                          bgcolor: "#172a45",
                          color: "#64ffda",
                        },
                        "&:hover": { bgcolor: "rgba(255,255,255,0.05)" },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          color: location.pathname.startsWith(
                            "/dashboard/customers",
                          )
                            ? "#64ffda"
                            : "grey.400",
                          minWidth: open ? 40 : "auto",
                          mr: open ? 1 : "auto",
                        }}
                      >
                        <PeopleAltOutlinedIcon />
                      </ListItemIcon>
                      {open && (
                        <ListItemText
                          primary={
                            <Typography
                              sx={{ fontSize: "0.88rem", fontWeight: 600 }}
                            >
                              Müşteri Yönetimi
                            </Typography>
                          }
                        />
                      )}
                    </ListItemButton>
                  </ListItem>
                </Tooltip>
              )}

              {hasPerm("musteri:goruntule") && (
                <Tooltip
                  title={!open ? "Vadesiz Hesap Yönetimi" : ""}
                  placement="right"
                >
                  <ListItem disablePadding sx={{ mb: 0.8 }}>
                    <ListItemButton
                      selected={location.pathname.startsWith(
                        "/dashboard/demand-accounts",
                      )}
                      onClick={() => navigate("/dashboard/demand-accounts")}
                      sx={{
                        borderRadius: 2,
                        justifyContent: open ? "initial" : "center",
                        px: 2,
                        "&.Mui-selected": {
                          bgcolor: "#172a45",
                          color: "#64ffda",
                        },
                        "&:hover": { bgcolor: "rgba(255,255,255,0.05)" },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          color: location.pathname.startsWith(
                            "/dashboard/demand-accounts",
                          )
                            ? "#64ffda"
                            : "grey.400",
                          minWidth: open ? 40 : "auto",
                          mr: open ? 1 : "auto",
                        }}
                      >
                        <AccountBalanceWalletIcon />
                      </ListItemIcon>
                      {open && (
                        <ListItemText
                          primary={
                            <Typography
                              sx={{ fontSize: "0.88rem", fontWeight: 600 }}
                            >
                              Vadesiz Hesap Yönetimi
                            </Typography>
                          }
                        />
                      )}
                    </ListItemButton>
                  </ListItem>
                </Tooltip>
              )}

              {/* VADELİ HESAP İŞLEMLERİ (AÇILIR MENÜ) */}
              {hasPerm("musteri:goruntule") && (
                <>
                  <Tooltip
                    title={!open ? "Vadeli Hesap İşlemleri" : ""}
                    placement="right"
                  >
                    <ListItem disablePadding sx={{ mb: 0.5 }}>
                      <ListItemButton
                        onClick={() => {
                          if (!open) setOpen(true); // Menü kapalıysa (collapsed) önce genişlet
                          setTimeMenuOpen(!timeMenuOpen);
                        }}
                        selected={location.pathname.startsWith(
                          "/dashboard/time-accounts",
                        )}
                        sx={{
                          borderRadius: 2,
                          justifyContent: open ? "initial" : "center",
                          px: 2,
                          "&.Mui-selected": {
                            bgcolor: "#172a45",
                            color: "#64ffda",
                          },
                          "&:hover": { bgcolor: "rgba(255,255,255,0.05)" },
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            color: location.pathname.startsWith(
                              "/dashboard/time-accounts",
                            )
                              ? "#64ffda"
                              : "grey.400",
                            minWidth: open ? 40 : "auto",
                            mr: open ? 1 : "auto",
                          }}
                        >
                          <AccessTimeIcon />
                        </ListItemIcon>
                        {open && (
                          <>
                            <ListItemText
                              primary={
                                <Typography
                                  sx={{ fontSize: "0.88rem", fontWeight: 600 }}
                                >
                                  Vadeli Hesap İşlemleri
                                </Typography>
                              }
                            />
                            {timeMenuOpen ? (
                              <ExpandLess
                                sx={{ fontSize: 18, color: "grey.400" }}
                              />
                            ) : (
                              <ExpandMore
                                sx={{ fontSize: 18, color: "grey.400" }}
                              />
                            )}
                          </>
                        )}
                      </ListItemButton>
                    </ListItem>
                  </Tooltip>

                  {/* ALT MENÜ (COLLAPSE) */}
                  {open && (
                    <Collapse in={timeMenuOpen} timeout="auto" unmountOnExit>
                      <List component="div" disablePadding sx={{ pl: 4 }}>
                        {/* 1. Hesap Açma */}
                        <ListItem disablePadding sx={{ mb: 0.3 }}>
                          <ListItemButton
                            selected={
                              location.pathname ===
                              "/dashboard/time-accounts/open"
                            }
                            onClick={() =>
                              navigate("/dashboard/time-accounts/open")
                            }
                            sx={{
                              borderRadius: 1.5,
                              py: 0.6,
                              px: 1.5,
                              "&.Mui-selected": {
                                bgcolor: "rgba(100, 255, 218, 0.1)",
                                color: "#64ffda",
                              },
                              "&:hover": { bgcolor: "rgba(255,255,255,0.03)" },
                            }}
                          >
                            <ListItemText
                              primary={
                                <Typography
                                  sx={{ fontSize: "0.82rem", fontWeight: 500 }}
                                >
                                  Hesap Açma
                                </Typography>
                              }
                            />
                          </ListItemButton>
                        </ListItem>

                        {/* 2. Hesap Güncelleme */}
                        <ListItem disablePadding sx={{ mb: 0.3 }}>
                          <ListItemButton
                            selected={
                              location.pathname ===
                              "/dashboard/time-accounts/update"
                            }
                            onClick={() =>
                              navigate("/dashboard/time-accounts/update")
                            }
                            sx={{
                              borderRadius: 1.5,
                              py: 0.6,
                              px: 1.5,
                              "&.Mui-selected": {
                                bgcolor: "rgba(100, 255, 218, 0.1)",
                                color: "#64ffda",
                              },
                              "&:hover": { bgcolor: "rgba(255,255,255,0.03)" },
                            }}
                          >
                            <ListItemText
                              primary={
                                <Typography
                                  sx={{ fontSize: "0.82rem", fontWeight: 500 }}
                                >
                                  Hesap Güncelleme
                                </Typography>
                              }
                            />
                          </ListItemButton>
                        </ListItem>

                        {/* 3. Hesap Kapama */}
                        <ListItem disablePadding sx={{ mb: 0.3 }}>
                          <ListItemButton
                            selected={
                              location.pathname ===
                              "/dashboard/time-accounts/close"
                            }
                            onClick={() =>
                              navigate("/dashboard/time-accounts/close")
                            }
                            sx={{
                              borderRadius: 1.5,
                              py: 0.6,
                              px: 1.5,
                              "&.Mui-selected": {
                                bgcolor: "rgba(100, 255, 218, 0.1)",
                                color: "#64ffda",
                              },
                              "&:hover": { bgcolor: "rgba(255,255,255,0.03)" },
                            }}
                          >
                            <ListItemText
                              primary={
                                <Typography
                                  sx={{ fontSize: "0.82rem", fontWeight: 500 }}
                                >
                                  Hesap Kapama
                                </Typography>
                              }
                            />
                          </ListItemButton>
                        </ListItem>
                      </List>
                    </Collapse>
                  )}
                </>
              )}
              {(hasPerm("para:yatirma") || hasPerm("para:cekme")) && (
                <Tooltip
                  title={!open ? "Gişe & Kasa İşlemleri" : ""}
                  placement="right"
                >
                  <ListItem disablePadding sx={{ mb: 0.8 }}>
                    <ListItemButton
                      selected={location.pathname.startsWith(
                        "/dashboard/cashier",
                      )}
                      onClick={() => navigate("/dashboard/cashier")}
                      sx={{
                        borderRadius: 2,
                        justifyContent: open ? "initial" : "center",
                        px: 2,
                        "&.Mui-selected": {
                          bgcolor: "#172a45",
                          color: "#64ffda",
                        },
                        "&:hover": { bgcolor: "rgba(255,255,255,0.05)" },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          color: location.pathname.startsWith(
                            "/dashboard/cashier",
                          )
                            ? "#64ffda"
                            : "grey.400",
                          minWidth: open ? 40 : "auto",
                          mr: open ? 1 : "auto",
                        }}
                      >
                        <PointOfSaleOutlinedIcon />
                      </ListItemIcon>
                      {open && (
                        <ListItemText
                          primary={
                            <Typography
                              sx={{ fontSize: "0.88rem", fontWeight: 600 }}
                            >
                              Gişe & Kasa İşlemleri
                            </Typography>
                          }
                        />
                      )}
                    </ListItemButton>
                  </ListItem>
                </Tooltip>
              )}

              {hasPerm("islem:limit_ustu:onay") && (
                <Tooltip
                  title={!open ? "Limit Üstü Onaylar" : ""}
                  placement="right"
                >
                  <ListItem disablePadding sx={{ mb: 0.8 }}>
                    <ListItemButton
                      selected={location.pathname.startsWith(
                        "/dashboard/approvals",
                      )}
                      onClick={() => navigate("/dashboard/approvals")}
                      sx={{
                        borderRadius: 2,
                        justifyContent: open ? "initial" : "center",
                        px: 2,
                        "&.Mui-selected": {
                          bgcolor: "#172a45",
                          color: "#64ffda",
                        },
                        "&:hover": { bgcolor: "rgba(255,255,255,0.05)" },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          color: location.pathname.startsWith(
                            "/dashboard/approvals",
                          )
                            ? "#64ffda"
                            : "grey.400",
                          minWidth: open ? 40 : "auto",
                          mr: open ? 1 : "auto",
                        }}
                      >
                        <FactCheckOutlinedIcon />
                      </ListItemIcon>
                      {open && (
                        <ListItemText
                          primary={
                            <Typography
                              sx={{ fontSize: "0.88rem", fontWeight: 600 }}
                            >
                              Limit Üstü Onaylar
                            </Typography>
                          }
                        />
                      )}
                    </ListItemButton>
                  </ListItem>
                </Tooltip>
              )}

              {hasPerm("sube:gun_sonu:kapatma") && (
                <Tooltip
                  title={!open ? "Gün Sonu Kapatma" : ""}
                  placement="right"
                >
                  <ListItem disablePadding sx={{ mb: 0.8 }}>
                    <ListItemButton
                      selected={location.pathname.startsWith("/dashboard/eod")}
                      onClick={() => navigate("/dashboard/eod")}
                      sx={{
                        borderRadius: 2,
                        justifyContent: open ? "initial" : "center",
                        px: 2,
                        "&.Mui-selected": {
                          bgcolor: "#172a45",
                          color: "#64ffda",
                        },
                        "&:hover": { bgcolor: "rgba(255,255,255,0.05)" },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          color: location.pathname.startsWith("/dashboard/eod")
                            ? "#64ffda"
                            : "grey.400",
                          minWidth: open ? 40 : "auto",
                          mr: open ? 1 : "auto",
                        }}
                      >
                        <LockClockOutlinedIcon />
                      </ListItemIcon>
                      {open && (
                        <ListItemText
                          primary={
                            <Typography
                              sx={{ fontSize: "0.88rem", fontWeight: 600 }}
                            >
                              Gün Sonu Kapatma
                            </Typography>
                          }
                        />
                      )}
                    </ListItemButton>
                  </ListItem>
                </Tooltip>
              )}

              {hasPerm("denetim:kayit:goruntule") && (
                <Tooltip
                  title={!open ? "Denetim İzleri (Logs)" : ""}
                  placement="right"
                >
                  <ListItem disablePadding sx={{ mb: 0.8 }}>
                    <ListItemButton
                      selected={location.pathname.startsWith(
                        "/dashboard/audit",
                      )}
                      onClick={() => navigate("/dashboard/audit")}
                      sx={{
                        borderRadius: 2,
                        justifyContent: open ? "initial" : "center",
                        px: 2,
                        "&.Mui-selected": {
                          bgcolor: "#172a45",
                          color: "#64ffda",
                        },
                        "&:hover": { bgcolor: "rgba(255,255,255,0.05)" },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          color: location.pathname.startsWith(
                            "/dashboard/audit",
                          )
                            ? "#64ffda"
                            : "grey.400",
                          minWidth: open ? 40 : "auto",
                          mr: open ? 1 : "auto",
                        }}
                      >
                        <PolicyOutlinedIcon />
                      </ListItemIcon>
                      {open && (
                        <ListItemText
                          primary={
                            <Typography
                              sx={{ fontSize: "0.88rem", fontWeight: 600 }}
                            >
                              Denetim İzleri (Logs)
                            </Typography>
                          }
                        />
                      )}
                    </ListItemButton>
                  </ListItem>
                </Tooltip>
              )}
            </>
          )}
        </List>

        {/* Profil Alanı */}
        <Box sx={{ mt: "auto", p: open ? 2 : 1, bgcolor: "rgba(0,0,0,0.2)" }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: open ? "flex-start" : "center",
              gap: 1.5,
            }}
          >
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
            {open && (
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
            )}
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
              {getPageTitle()}
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
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 600,
                }}
              >
                Çıkış
              </Button>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Alt Sayfaların Render Edildiği Alan */}
        <Container maxWidth="lg" sx={{ py: 4, flexGrow: 1 }}>
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
};
