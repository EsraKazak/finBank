import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Button,
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
  Alert,
} from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import { AgGridReact } from "ag-grid-react";
import type { ColDef } from "ag-grid-community";
import api from "../../services/api";

interface Role {
  id: string;
  name: string;
}

interface Branch {
  id: number;
  code: string;
  name: string;
}

interface AuthorizedPersonnel {
  id: string;
  name: string;
  surname: string;
  email: string;
  roleId: string;
  branchId: number;
  role?: Role;
  branch?: Branch;
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
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<{
    name: string;
    surname: string;
    email: string;
    roleId: string;
    branchId: number | "";
  }>({
    name: "",
    surname: "",
    email: "",
    roleId: "",
    branchId: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [listRes, rolesRes, branchesRes] = await Promise.all([
        api.get("/auth/authorized-personnel"),
        api.get("/admin/roles"),
        api.get("/customers/branches"),
      ]);

      setList(listRes.data.data || []);

      const rolesData =
        rolesRes.data.data?.roles || rolesRes.data.data || rolesRes.data || [];
      setRoles(rolesData);

      setBranches(branchesRes.data.data || []);
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
    if (!formData.branchId || !formData.roleId) {
      alert("Lütfen rol ve şube seçimini eksiksiz yapınız.");
      return;
    }

    try {
      await api.post("/auth/authorized-personnel", {
        ...formData,
        branchId: Number(formData.branchId),
      });
      setOpenModal(false);
      setFormData({
        name: "",
        surname: "",
        email: "",
        roleId: "",
        branchId: "",
      });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Ekleme başarısız.");
    }
  };

  const columnDefs = useMemo<ColDef<AuthorizedPersonnel>[]>(
    () => [
      {
        headerName: "Ad Soyad",
        valueGetter: (params) =>
          `${params.data?.name || ""} ${params.data?.surname || ""}`,
        flex: 1.2,
        cellRenderer: (params: any) => (
          <Typography sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
            {params.value}
          </Typography>
        ),
      },
      {
        headerName: "Kurumsal E-posta",
        field: "email",
        flex: 1.5,
      },
      {
        headerName: "Görev Şubesi",
        field: "branch",
        valueGetter: (params) => params.data?.branch?.name || "-",
        flex: 1.2,
        cellRenderer: (params: any) => {
          const branch = params.data?.branch;
          return branch ? (
            <Chip
              label={`${branch.code} - ${branch.name}`}
              size="small"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
          ) : (
            "-"
          );
        },
      },
      {
        headerName: "Tanımlanan Rol",
        field: "role",
        flex: 1.4,
        cellRenderer: (params: any) => {
          const roleName = params.data?.role?.name;
          return (
            <Chip
              label={
                roleName
                  ? roleDisplayNames[roleName] || roleName
                  : "Rol Seçilmedi"
              }
              size="small"
              sx={{
                bgcolor: "#e3f2fd",
                color: "#1976d2",
                fontWeight: 700,
              }}
            />
          );
        },
      },
      {
        headerName: "Kayıt Durumu",
        field: "status",
        flex: 1.2,
        cellRenderer: (params: any) => {
          const isCompleted = params.value === "COMPLETED";
          return (
            <Chip
              label={isCompleted ? "Kayıt Tamamlandı" : "Aktivasyon Bekliyor"}
              size="small"
              color={isCompleted ? "success" : "warning"}
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
          );
        },
      },
      {
        headerName: "Davet Tarihi",
        field: "createdAt",
        flex: 1,
        valueFormatter: (params) =>
          params.value
            ? new Date(params.value).toLocaleDateString("tr-TR")
            : "",
      },
    ],
    [],
  );

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

      <Box
        sx={{
          borderRadius: 3,
          border: "1px solid #e2e8f0",
          overflow: "hidden",
        }}
      >
        <div className="ag-theme-alpine" style={{ height: 450, width: "100%" }}>
          <AgGridReact
            rowData={list}
            columnDefs={columnDefs}
            loading={loading}
            pagination={true}
            paginationPageSize={10}
            paginationPageSizeSelector={[10, 20, 50]}
            animateRows={true}
            overlayNoRowsTemplate="<span>Henüz davet edilmiş personel kaydı bulunmuyor.</span>"
          />
        </div>
      </Box>

      {/* ŞUBE VE ROL SEÇİMLİ PERSONEL EKLEME MODALI */}
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

            {/* Şube Seçim Dropdown */}
            <FormControl required fullWidth size="small">
              <InputLabel id="branch-select-label">
                Görev Yapacağı Şube
              </InputLabel>
              <Select
                labelId="branch-select-label"
                label="Görev Yapacağı Şube"
                value={formData.branchId}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    branchId: Number(e.target.value),
                  })
                }
              >
                {branches.map((branch) => (
                  <MenuItem key={branch.id} value={branch.id}>
                    {branch.code} - {branch.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

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
