import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Card,
  Typography,
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
import { AgGridReact } from "ag-grid-react";
import type { ColDef } from "ag-grid-community";
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

  const columnDefs = useMemo<ColDef<IAdminUserItem>[]>(
    () => [
      {
        headerName: "PERSONEL",
        field: "name",
        flex: 1.6,
        cellRenderer: (params: any) => {
          const u = params.data as IAdminUserItem;
          if (!u) return null;
          return (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                height: "100%",
              }}
            >
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  fontSize: 13,
                  fontWeight: 700,
                  bgcolor: "#0f172a",
                  color: "#fff",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
                }}
              >
                {u.name?.[0]}
                {u.surname?.[0]}
              </Avatar>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 700,
                    color: "#0f172a",
                    fontSize: "0.875rem",
                    lineHeight: 1.2,
                  }}
                >
                  {u.name} {u.surname}
                </Typography>
                <Typography
                  sx={{ color: "#64748b", fontSize: "0.75rem", mt: 0.2 }}
                >
                  Kayıt: {new Date(u.createdAt).toLocaleDateString("tr-TR")}
                </Typography>
              </Box>
            </Box>
          );
        },
      },
      {
        headerName: "KURUMSAL KİMLİK",
        field: "email",
        flex: 1.3,
        cellRenderer: (params: any) => {
          const val = params.value || params.data?.username;
          return (
            <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
              <Typography
                sx={{ color: "#334155", fontSize: "0.85rem", fontWeight: 500 }}
              >
                {val}
              </Typography>
            </Box>
          );
        },
      },
      {
        headerName: "GÜNCEL ROLÜ",
        field: "userRole.role.name",
        flex: 1.5,
        cellRenderer: (params: any) => {
          const u = params.data as IAdminUserItem;
          const isEditing = editingUserId === u?.id;
          const currentRoleName = u?.userRole?.role.name;

          return (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                height: "100%",
                width: "100%",
              }}
            >
              {isEditing ? (
                <FormControl size="small" fullWidth>
                  <Select
                    value={selectedRoleId}
                    onChange={(e) => setSelectedRoleId(e.target.value)}
                    sx={{
                      bgcolor: "#fff",
                      fontSize: 13,
                      height: 36,
                      borderRadius: 1.5,
                    }}
                  >
                    {roles.map((r) => (
                      <MenuItem key={r.id} value={r.id} sx={{ fontSize: 13 }}>
                        {roleDisplayNames[r.name] || r.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : (
                <Chip
                  label={
                    currentRoleName
                      ? roleDisplayNames[currentRoleName] || currentRoleName
                      : "Tanımsız"
                  }
                  size="small"
                  sx={{
                    fontWeight: 700,
                    fontSize: 11,
                    px: 0.5,
                    bgcolor:
                      currentRoleName === "YONETICI" ? "#fee2e2" : "#e0f2fe",
                    color:
                      currentRoleName === "YONETICI" ? "#991b1b" : "#0369a1",
                    border: `1px solid ${
                      currentRoleName === "YONETICI" ? "#fecaca" : "#bae6fd"
                    }`,
                  }}
                />
              )}
            </Box>
          );
        },
      },
      {
        headerName: "İSTİSNAİ YETKİLER",
        field: "userPermissions",
        cellDataType: false,
        flex: 1.2,
        cellRenderer: (params: any) => {
          const count = params.value?.length || 0;
          return (
            <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
              <Chip
                label={count > 0 ? `+${count} Özel Yetki` : "Standart Yetki"}
                size="small"
                sx={{
                  fontWeight: 600,
                  fontSize: 11,
                  bgcolor: count > 0 ? "#ede9fe" : "#f1f5f9",
                  color: count > 0 ? "#6d28d9" : "#64748b",
                  border: `1px solid ${count > 0 ? "#ddd6fe" : "#e2e8f0"}`,
                }}
              />
            </Box>
          );
        },
      },
      {
        headerName: "İŞLEMLER",
        field: "id",
        flex: 1.4,
        sortable: false,
        filter: false,
        cellClass: "ag-cell-right",
        headerClass: "ag-header-cell-right",
        cellRenderer: (params: any) => {
          const u = params.data as IAdminUserItem;
          const isEditing = editingUserId === u?.id;

          return (
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                gap: 1,
                height: "100%",
              }}
            >
              {isEditing ? (
                <>
                  <Tooltip title="Kaydet">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handlePromptConfirm(u)}
                      disabled={selectedRoleId === u.userRole?.role.id}
                      sx={{
                        bgcolor: "#eff6ff",
                        "&:hover": { bgcolor: "#dbeafe" },
                      }}
                    >
                      <CheckCircleRoundedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="İptal">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => setEditingUserId(null)}
                      sx={{
                        bgcolor: "#fef2f2",
                        "&:hover": { bgcolor: "#fee2e2" },
                      }}
                    >
                      <CancelRoundedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </>
              ) : (
                <>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<EditRoundedIcon sx={{ fontSize: 14 }} />}
                    onClick={() => handleStartEdit(u)}
                    sx={{
                      textTransform: "none",
                      borderRadius: 1.5,
                      fontWeight: 600,
                      fontSize: 11,
                      py: 0.3,
                      px: 1,
                      borderColor: "#cbd5e1",
                      color: "#334155",
                      "&:hover": {
                        borderColor: "#94a3b8",
                        bgcolor: "#f8fafc",
                      },
                    }}
                  >
                    Rol Değiştir
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<SecurityRoundedIcon sx={{ fontSize: 14 }} />}
                    onClick={() => handleOpenPermModal(u)}
                    sx={{
                      textTransform: "none",
                      borderRadius: 1.5,
                      fontWeight: 600,
                      fontSize: 11,
                      py: 0.3,
                      px: 1,
                      bgcolor: "#0f172a",
                      "&:hover": { bgcolor: "#1e293b" },
                    }}
                  >
                    Yetkileri Yönet
                  </Button>
                </>
              )}
            </Box>
          );
        },
      },
    ],
    [editingUserId, selectedRoleId, roles],
  );

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

      {/* AG GRID KARTI */}
      <Card
        sx={{
          borderRadius: 3,
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          border: "1px solid #e2e8f0",
          overflow: "hidden",
        }}
      >
        <div className="ag-theme-alpine" style={{ height: 500, width: "100%" }}>
          <AgGridReact
            rowData={users}
            columnDefs={columnDefs}
            loading={loading}
            rowHeight={64}
            pagination={true}
            paginationPageSize={10}
            paginationPageSizeSelector={[10, 20, 50]}
            animateRows={true}
            overlayNoRowsTemplate="<span>Sistemde kayıtlı personel bulunamadı.</span>"
          />
        </div>
      </Card>

      {/* ROL DEĞİŞİKLİĞİ ONAY MODALI */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog((p) => ({ ...p, open: false }))}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3, p: 1 } } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: 16 }}>
          Rol Değişikliği Onayı
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1.5 }}>
            <strong>{confirmDialog.userName}</strong> kullanıcısının yeni rolü{" "}
            <strong>{confirmDialog.roleName}</strong> olarak güncellenecektir.
          </Typography>
          <Alert severity="warning" sx={{ fontSize: 12, borderRadius: 2 }}>
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
        slotProps={{ paper: { sx: { borderRadius: 3, p: 1 } } }}
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
