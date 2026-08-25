import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
} from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import api from "../../services/api";

interface Role {
  id: string;
  name: string;
}

interface AuthorizedPersonnel {
  id: string;
  name: string;
  surname: string;
  email: string;
  roleId: string;
  role?: Role;
  status: "PENDING" | "COMPLETED";
  createdAt: string;
}

const roleDisplayNames: Record<string, string> = {
  YONETICI: "Sistem Yöneticisi",
  SUBE_MUDURU: "Şube Müdürü",
  MUSTERI_ILISKILERI_YONETICISI: "Müşteri İlişkileri Yöneticisi",
  MUSTERI_ILISKILERI_ASISTANI: "Müşteri İlişkileri Asistanı",
  GISE_YETKILISI: "Gişe Yetkilisi",
};

export const PersonnelManagement: React.FC<{
  viewMode: "whitelist" | "roles";
}> = ({ viewMode }) => {
  const [list, setList] = useState<AuthorizedPersonnel[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    email: "",
    roleId: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [listRes, rolesRes] = await Promise.all([
        api.get("/auth/authorized-personnel"),
        api.get("/admin/roles"),
      ]);

      // Beyaz liste kayıtları
      setList(listRes.data.data || []);

      // Gelen veri { roles: [...] } şeklinde mi yoksa doğrudan dizi mi kontrolü:
      const rolesData =
        rolesRes.data.data?.roles || rolesRes.data.data || rolesRes.data || [];
      setRoles(rolesData);
    } catch (err: any) {
      setError("Veriler yüklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddPersonnel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/auth/authorized-personnel", formData);
      setOpenModal(false);
      setFormData({ name: "", surname: "", email: "", roleId: "" });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Ekleme başarısız.");
    }
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 800, color: "#0a192f" }}>
          {viewMode === "whitelist"
            ? "Yetkilendirilmiş Personel Davet Listesi"
            : "Rol & Yetki Listesi"}
        </Typography>
        {viewMode === "whitelist" && (
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={() => setOpenModal(true)}
            sx={{
              borderRadius: 2,
              background: "linear-gradient(135deg, #1976d2 0%, #0d47a1 100%)",
              textTransform: "none",
              fontWeight: 700,
            }}
          >
            Yeni Personel Davet Et
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1px solid #e2e8f0",
          overflow: "hidden",
        }}
      >
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: "#f8fafc" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Ad Soyad</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Kurumsal E-posta</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Tanımlanan Rol</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Kayıt Durumu</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Davet Tarihi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : list.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    align="center"
                    sx={{ py: 3, color: "text.secondary" }}
                  >
                    Henüz davet edilmiş personel kaydı bulunmuyor.
                  </TableCell>
                </TableRow>
              ) : (
                list.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell
                      sx={{ fontWeight: 600 }}
                    >{`${item.name} ${item.surname}`}</TableCell>
                    <TableCell>{item.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={
                          item.role?.name
                            ? roleDisplayNames[item.role.name] || item.role.name
                            : "Rol Seçilmedi"
                        }
                        size="small"
                        sx={{
                          bgcolor: "#e3f2fd",
                          color: "#1976d2",
                          fontWeight: 700,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={
                          item.status === "COMPLETED"
                            ? "Kayıt Tamamlandı"
                            : "Aktivasyon Bekliyor"
                        }
                        size="small"
                        color={
                          item.status === "COMPLETED" ? "success" : "warning"
                        }
                        variant="outlined"
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(item.createdAt).toLocaleDateString("tr-TR")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* ROL SEÇİMLİ PERSONEL EKLEME MODALI */}
      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800, color: "#0a192f" }}>
          Yeni Personel Daveti Oluştur
        </DialogTitle>
        <Box component="form" onSubmit={handleAddPersonnel}>
          <DialogContent
            sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}
          >
            <TextField
              label="Ad"
              required
              fullWidth
              size="small"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
            <TextField
              label="Soyad"
              required
              fullWidth
              size="small"
              value={formData.surname}
              onChange={(e) =>
                setFormData({ ...formData, surname: e.target.value })
              }
            />
            <TextField
              label="Kurumsal E-posta"
              type="email"
              required
              fullWidth
              size="small"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />

            {/* Rol Seçim Dropdown */}
            <FormControl required fullWidth size="small">
              <InputLabel id="role-select-label">Rol Tanımla</InputLabel>
              <Select
                labelId="role-select-label"
                label="Rol Tanımla"
                value={formData.roleId}
                onChange={(e) =>
                  setFormData({ ...formData, roleId: e.target.value })
                }
              >
                {roles.map((role) => (
                  <MenuItem key={role.id} value={role.id}>
                    {roleDisplayNames[role.name] || role.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions sx={{ p: 2.5, pt: 0 }}>
            <Button onClick={() => setOpenModal(false)} color="inherit">
              İptal
            </Button>
            <Button type="submit" variant="contained" sx={{ fontWeight: 700 }}>
              Daveti Kaydet
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};
