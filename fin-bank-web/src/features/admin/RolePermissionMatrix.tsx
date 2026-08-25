import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Tooltip,
  Avatar,
} from "@mui/material";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import api from "../../services/api";
import type {
  IAdminUserItem,
  IRole,
  IPermission,
} from "../../types/auth.types";

const roleDisplayNames: Record<string, string> = {
  YONETICI: "Sistem Yöneticisi",
  SUBE_MUDURU: "Şube Müdürü",
  MUSTERI_ILISKILERI_YONETICISI: "Müşteri İlişkileri Yöneticisi",
  MUSTERI_ILISKILERI_ASISTANI: "Müşteri İlişkileri Asistanı",
  GISE_YETKILISI: "Gişe Yetkilisi",
};

const permissionDisplayNames: Record<string, string> = {
  "musteri:goruntule": "Müşteri Görüntüleme",
  "musteri:yonet": "Müşteri Yönetimi / Hesap Açılışı",
  "hesap:bakiye:goruntule": "Hesap & Bakiye Sorgulama",
  "para:yatirma": "Para Yatırma İşlemleri",
  "para:cekme": "Para Çekme İşlemleri",
  "islem:limit_ustu:onay": "Limit Üstü Transfer Onayı",
  "sube:gun_sonu:kapatma": "Şube Gün Sonu Mutabakatı",
  "denetim:kayit:goruntule": "Sistem Log & Denetim İzleme",
  "personel:yonetimi": "Personel & Rol Yetkilendirme",
};

export const RolePermissionMatrix: React.FC = () => {
  const [users, setUsers] = useState<IAdminUserItem[]>([]);
  const [roles, setRoles] = useState<IRole[]>([]);
  const [permissions, setPermissions] = useState<IPermission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");

  const [permModalUser, setPermModalUser] = useState<IAdminUserItem | null>(
    null,
  );
  const [selectedPermIds, setSelectedPermIds] = useState<string[]>([]);
  const [savingPerms, setSavingPerms] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    userId: string;
    userName: string;
    roleId: string;
    roleName: string;
  }>({
    open: false,
    userId: "",
    userName: "",
    roleId: "",
    roleName: "",
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, rolesRes] = await Promise.all([
        api.get("/admin/users"),
        api.get("/admin/roles-permissions"),
      ]);
      setUsers(usersRes.data.data || []);
      setRoles(rolesRes.data.data?.roles || rolesRes.data.roles || []);
      setPermissions(
        rolesRes.data.data?.permissions || rolesRes.data.permissions || [],
      );
    } catch (err: any) {
      setError("Veriler yüklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStartEdit = (user: IAdminUserItem) => {
    setEditingUserId(user.id);
    setSelectedRoleId(user.userRole?.role.id || "");
  };

  const handlePromptConfirm = (user: IAdminUserItem) => {
    const targetRole = roles.find((r) => r.id === selectedRoleId);
    if (!targetRole) return;
    setConfirmDialog({
      open: true,
      userId: user.id,
      userName: `${user.name} ${user.surname}`,
      roleId: selectedRoleId,
      roleName: roleDisplayNames[targetRole.name] || targetRole.name,
    });
  };

  const handleExecuteRoleChange = async () => {
    try {
      await api.post("/admin/assign-role", {
        userId: confirmDialog.userId,
        roleId: confirmDialog.roleId,
      });
      setConfirmDialog((p) => ({ ...p, open: false }));
      setEditingUserId(null);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Rol güncellenemedi.");
    }
  };

  const handleOpenPermModal = (user: IAdminUserItem) => {
    setPermModalUser(user);
    const existingPermIds =
      user.userPermissions?.map((up) => up.permission.id) || [];
    setSelectedPermIds(existingPermIds);
  };

  const handleTogglePermission = (permId: string) => {
    setSelectedPermIds((prev) =>
      prev.includes(permId)
        ? prev.filter((id) => id !== permId)
        : [...prev, permId],
    );
  };

  const handleSavePermissions = async () => {
    if (!permModalUser) return;
    setSavingPerms(true);
    try {
      await api.post("/admin/assign-permissions", {
        userId: permModalUser.id,
        permissionIds: selectedPermIds,
      });
      setPermModalUser(null);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Yetkiler kaydedilemedi.");
    } finally {
      setSavingPerms(false);
    }
  };

  return (
    <Box sx={{ width: "100%", pb: 3 }}>
      {/* BAŞLIK ALANI */}
      <Box sx={{ mb: 2.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: "#0a192f" }}>
          Personel & Rol Yetkilendirme Matrisi
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontSize: 13 }}
        >
          Kayıtlı personellerin unvanlarını ve istisnai yetki tanımlamalarını
          yönetin.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* TABLO */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2.5,
          border: "1px solid #e2e8f0",
          overflow: "hidden",
        }}
      >
        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: "#f8fafc" }}>
              <TableRow>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    color: "#475569",
                    fontSize: 12,
                    py: 1.5,
                  }}
                >
                  PERSONEL
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    color: "#475569",
                    fontSize: 12,
                    py: 1.5,
                  }}
                >
                  KURUMSAL KİMLİK
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    color: "#475569",
                    fontSize: 12,
                    py: 1.5,
                  }}
                >
                  GÜNCEL ROLÜ
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    color: "#475569",
                    fontSize: 12,
                    py: 1.5,
                  }}
                >
                  İSTİSNAİ YETKİLER
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: 700,
                    color: "#475569",
                    fontSize: 12,
                    py: 1.5,
                  }}
                >
                  İŞLEMLER
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={26} thickness={4} />
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    align="center"
                    sx={{ py: 3, color: "text.secondary", fontSize: 13 }}
                  >
                    Sistemde kayıtlı personel bulunamadı.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => {
                  const isEditing = editingUserId === u.id;
                  const currentRoleName = u.userRole?.role.name;
                  const extraPermsCount = u.userPermissions?.length || 0;

                  return (
                    <TableRow
                      key={u.id}
                      hover
                      sx={{
                        bgcolor: isEditing ? "#f0f7ff" : "inherit",
                      }}
                    >
                      <TableCell sx={{ py: 1.5 }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.2,
                          }}
                        >
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              fontSize: 12,
                              fontWeight: 700,
                              bgcolor: "#0a192f",
                            }}
                          >
                            {u.name?.[0]}
                            {u.surname?.[0]}
                          </Avatar>
                          <Box>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 700,
                                color: "#0f172a",
                                fontSize: 13,
                              }}
                            >
                              {u.name} {u.surname}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ color: "#94a3b8", fontSize: 11 }}
                            >
                              Kayıt:{" "}
                              {new Date(u.createdAt).toLocaleDateString(
                                "tr-TR",
                              )}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      <TableCell sx={{ color: "#334155", fontSize: 13 }}>
                        {u.email || u.username}
                      </TableCell>

                      <TableCell sx={{ minWidth: 180 }}>
                        {isEditing ? (
                          <FormControl size="small" fullWidth>
                            <Select
                              value={selectedRoleId}
                              onChange={(e) =>
                                setSelectedRoleId(e.target.value)
                              }
                              sx={{ bgcolor: "#fff", fontSize: 13 }}
                            >
                              {roles.map((r) => (
                                <MenuItem
                                  key={r.id}
                                  value={r.id}
                                  sx={{ fontSize: 13 }}
                                >
                                  {roleDisplayNames[r.name] || r.name}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        ) : (
                          <Chip
                            label={
                              currentRoleName
                                ? roleDisplayNames[currentRoleName] ||
                                  currentRoleName
                                : "Tanımsız"
                            }
                            size="small"
                            sx={{
                              fontWeight: 600,
                              fontSize: 11,
                              bgcolor:
                                currentRoleName === "YONETICI"
                                  ? "#fee2e2"
                                  : "#e0f2fe",
                              color:
                                currentRoleName === "YONETICI"
                                  ? "#991b1b"
                                  : "#0369a1",
                            }}
                          />
                        )}
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={
                            extraPermsCount > 0
                              ? `+${extraPermsCount} Özel Yetki`
                              : "Standart Yetki"
                          }
                          size="small"
                          sx={{
                            fontWeight: 600,
                            fontSize: 11,
                            bgcolor:
                              extraPermsCount > 0 ? "#ede9fe" : "#f1f5f9",
                            color: extraPermsCount > 0 ? "#6d28d9" : "#64748b",
                          }}
                        />
                      </TableCell>

                      <TableCell align="right">
                        {isEditing ? (
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "flex-end",
                              gap: 0.5,
                            }}
                          >
                            <Tooltip title="Kaydet">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handlePromptConfirm(u)}
                                disabled={
                                  selectedRoleId === u.userRole?.role.id
                                }
                              >
                                <CheckCircleRoundedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="İptal">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => setEditingUserId(null)}
                              >
                                <CancelRoundedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        ) : (
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "flex-end",
                              gap: 1,
                            }}
                          >
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={
                                <EditRoundedIcon sx={{ fontSize: 14 }} />
                              }
                              onClick={() => handleStartEdit(u)}
                              sx={{
                                textTransform: "none",
                                borderRadius: 1.5,
                                fontWeight: 600,
                                fontSize: 11,
                                py: 0.4,
                              }}
                            >
                              Rol Değiştir
                            </Button>
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={
                                <SecurityRoundedIcon sx={{ fontSize: 14 }} />
                              }
                              onClick={() => handleOpenPermModal(u)}
                              sx={{
                                textTransform: "none",
                                borderRadius: 1.5,
                                fontWeight: 600,
                                fontSize: 11,
                                py: 0.4,
                                bgcolor: "#0a192f",
                                "&:hover": { bgcolor: "#1e293b" },
                              }}
                            >
                              Yetkileri Yönet
                            </Button>
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* ROL DEĞİŞİKLİĞİ ONAY MODALI */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog((p) => ({ ...p, open: false }))}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: 16 }}>
          Rol Değişikliği Onayı
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1.5 }}>
            <strong>{confirmDialog.userName}</strong> kullanıcısının yeni rolü{" "}
            <strong>{confirmDialog.roleName}</strong> olarak güncellenecektir.
          </Typography>
          <Alert severity="warning" sx={{ fontSize: 12 }}>
            Bu işlem personelin sistem izinlerini anında günceller.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setConfirmDialog((p) => ({ ...p, open: false }))}
            color="inherit"
            size="small"
          >
            Vazgeç
          </Button>
          <Button
            onClick={handleExecuteRoleChange}
            variant="contained"
            size="small"
            sx={{ fontWeight: 700, bgcolor: "#0a192f" }}
          >
            Onayla
          </Button>
        </DialogActions>
      </Dialog>

      {/* ÖZEL YETKİ SEÇİM MODALI */}
      <Dialog
        open={Boolean(permModalUser)}
        onClose={() => setPermModalUser(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            fontSize: 15,
            borderBottom: "1px solid #f1f5f9",
          }}
        >
          Özel Yetkiler ({permModalUser?.name} {permModalUser?.surname})
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <FormGroup>
            {permissions.map((perm) => (
              <FormControlLabel
                key={perm.id}
                control={
                  <Checkbox
                    size="small"
                    checked={selectedPermIds.includes(perm.id)}
                    onChange={() => handleTogglePermission(perm.id)}
                  />
                }
                label={
                  <Typography
                    variant="body2"
                    sx={{ fontSize: 13, fontWeight: 500 }}
                  >
                    {permissionDisplayNames[perm.code] || perm.code}
                  </Typography>
                }
                sx={{ mb: 0.5 }}
              />
            ))}
          </FormGroup>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: "1px solid #f1f5f9" }}>
          <Button
            onClick={() => setPermModalUser(null)}
            color="inherit"
            size="small"
          >
            İptal
          </Button>
          <Button
            onClick={handleSavePermissions}
            variant="contained"
            size="small"
            disabled={savingPerms}
            sx={{ fontWeight: 700, bgcolor: "#0a192f" }}
          >
            {savingPerms ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
