import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Select,
  MenuItem,
  Chip,
  Alert,
  Stack,
  CircularProgress,
  IconButton,
  Tooltip,
} from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import CheckOutlinedIcon from "@mui/icons-material/CheckOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";

import { adminApi } from "../../services/api";
import type { IAdminUserItem, IRole } from "../../types/auth.types";

interface Props {
  viewMode: "whitelist" | "roles";
}

export const PersonnelManagement: React.FC<Props> = ({ viewMode }) => {
  // Form State (Beyaz Liste İçin)
  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    email: "",
  });
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Tablo & Rol State
  const [users, setUsers] = useState<IAdminUserItem[]>([]);
  const [roles, setRoles] = useState<IRole[]>([]);
  const [loading, setLoading] = useState(true);

  // Düzenleme Satır State'leri (Hangi kullanıcı düzenleniyor & Seçilen Geçici Rol)
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [savingUserId, setSavingUserId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, metaData] = await Promise.all([
        adminApi.getUsers(),
        adminApi.getRolesAndPermissions(),
      ]);
      setUsers(usersData || []);
      setRoles(metaData?.roles || []);
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err.response?.data?.message || "Veriler yüklenirken hata oluştu.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    setEditingUserId(null);
  }, [viewMode]);

  // Beyaz Listeye Personel Ekle
  const handleAddWhitelist = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    try {
      await adminApi.addAuthorizedPersonnel(formData);
      setFeedback({
        type: "success",
        text: "Personel başarıyla davet listesine eklendi.",
      });
      setFormData({ name: "", surname: "", email: "" });
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err.response?.data?.message || "Ekleme başarısız.",
      });
    }
  };

  // Düzenleme Modunu Başlat
  const handleStartEdit = (user: IAdminUserItem) => {
    setEditingUserId(user.id);
    setSelectedRoleId(user.userRole?.role?.id || "");
  };

  // Düzenlemeyi İptal Et
  const handleCancelEdit = () => {
    setEditingUserId(null);
    setSelectedRoleId("");
  };

  // Rol Değişikliğini Onaylayıp Kaydet
  const handleSaveRole = async (userId: string) => {
    if (!selectedRoleId) {
      setFeedback({ type: "error", text: "Lütfen geçerli bir rol seçiniz." });
      return;
    }

    try {
      setSavingUserId(userId);
      await adminApi.assignRole(userId, selectedRoleId);
      setFeedback({ type: "success", text: "Rol başarıyla güncellendi." });
      setEditingUserId(null);
      await loadData();
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err.response?.data?.message || "Rol atanamadı.",
      });
    } finally {
      setSavingUserId(null);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {feedback && (
        <Alert severity={feedback.type} onClose={() => setFeedback(null)}>
          {feedback.text}
        </Alert>
      )}

      {/* 1. SAYFA: SADECE BEYAZ LİSTE (DAVET) */}
      {viewMode === "whitelist" && (
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
            sx={{ fontWeight: 800, color: "#0a192f" }}
            gutterBottom
          >
            Personel Davet Listesi
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
            Sisteme kayıt olmasına izin verilecek personelleri listeye ekleyin.
          </Typography>

          <form onSubmit={handleAddWhitelist}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Ad"
                size="small"
                required
                fullWidth
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
              <TextField
                label="Soyad"
                size="small"
                required
                fullWidth
                value={formData.surname}
                onChange={(e) =>
                  setFormData({ ...formData, surname: e.target.value })
                }
              />
              <TextField
                label="Kurumsal E-posta"
                type="email"
                size="small"
                required
                fullWidth
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
              <Button
                type="submit"
                variant="contained"
                startIcon={<PersonAddIcon />}
                sx={{
                  minWidth: 170,
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 700,
                }}
              >
                Listeye Ekle
              </Button>
            </Stack>
          </form>
        </Paper>
      )}

      {/* 2. SAYFA: PERSONEL VE ROL YÖNETİM TABLOSU */}
      {viewMode === "roles" && (
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
            sx={{ fontWeight: 800, color: "#0a192f" }}
            gutterBottom
          >
            Kayıtlı Personeller ve Rol Yönetimi
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
            Kayıt olmuş personellerin rollerini düzenlemek için "Düzenle"
            butonunu kullanın.
          </Typography>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
              <CircularProgress size={32} />
            </Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Personel</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Kullanıcı Adı</strong>
                  </TableCell>
                  <TableCell>
                    <strong>E-posta</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Mevcut Rol</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>İşlemler</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((u) => {
                  const isEditing = editingUserId === u.id;
                  const isSaving = savingUserId === u.id;

                  return (
                    <TableRow key={u.id} hover>
                      <TableCell>
                        {u.name} {u.surname}
                      </TableCell>
                      <TableCell>@{u.username}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Select
                            size="small"
                            value={selectedRoleId}
                            onChange={(e) => setSelectedRoleId(e.target.value)}
                            sx={{ minWidth: 190, borderRadius: 2 }}
                          >
                            <MenuItem value="" disabled>
                              <em>Rol Seçiniz</em>
                            </MenuItem>
                            {roles.map((r) => (
                              <MenuItem key={r.id} value={r.id}>
                                {r.name}
                              </MenuItem>
                            ))}
                          </Select>
                        ) : u.userRole?.role ? (
                          <Chip
                            label={u.userRole.role.name}
                            color="primary"
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                        ) : (
                          <Chip
                            label="Rol Atanmadı"
                            color="warning"
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {isEditing ? (
                          <Stack
                            direction="row"
                            spacing={1}
                            sx={{ justifyContent: "flex-end" }}
                          >
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              startIcon={<CheckOutlinedIcon />}
                              disabled={isSaving}
                              onClick={() => handleSaveRole(u.id)}
                              sx={{ textTransform: "none", borderRadius: 2 }}
                            >
                              {isSaving ? "Kaydediliyor..." : "Kaydet"}
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="inherit"
                              startIcon={<CloseOutlinedIcon />}
                              disabled={isSaving}
                              onClick={handleCancelEdit}
                              sx={{ textTransform: "none", borderRadius: 2 }}
                            >
                              İptal
                            </Button>
                          </Stack>
                        ) : (
                          <Tooltip title="Rolü Düzenle">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleStartEdit(u)}
                              sx={{
                                border: "1px solid #e2e8f0",
                                borderRadius: 2,
                              }}
                            >
                              <EditOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Paper>
      )}
    </Box>
  );
};
