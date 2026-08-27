// src/pages/dashboard/WhitelistPage.tsx
import React, { useState, useEffect } from "react";
import {
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
} from "@mui/material";
import api from "../../services/api";
import { PersonnelManagement } from "../../features/admin/PersonnelManagement";

// Modal Bileşeni
export const AddPersonnelModal = ({ onSuccess }: { onSuccess: () => void }) => {
  const [roles, setRoles] = useState<{ id: string; name: string }[]>([]);
  const [branches, setBranches] = useState<
    { id: number; code: string; name: string }[]
  >([]);
  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    email: "",
    roleId: "",
    branchId: "",
  });

  const roleDisplayNames: Record<string, string> = {
    YONETICI: "Sistem Yöneticisi",
    SUBE_MUDURU: "Şube Müdürü",
    MUSTERI_ILISKILERI_YONETICISI: "Müşteri İlişkileri Yöneticisi",
    MUSTERI_ILISKILERI_ASISTANI: "Müşteri İlişkileri Asistanı",
    GISE_YETKILISI: "Gişe Yetkilisi",
  };

  useEffect(() => {
    const fetchParams = async () => {
      try {
        const [rolesRes, branchesRes] = await Promise.all([
          api.get("/admin/roles"),
          api.get("/branches"),
        ]);
        setRoles(rolesRes.data.data || rolesRes.data || []);
        setBranches(branchesRes.data.data || []);
      } catch (err) {
        console.error("Parametreler yüklenemedi", err);
      }
    };
    fetchParams();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.branchId || !formData.roleId) return;
    try {
      await api.post("/auth/authorized-personnel", {
        ...formData,
        branchId: Number(formData.branchId),
      });
      onSuccess();
    } catch (err: any) {
      alert(err.response?.data?.message || "Hata oluştu");
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ display: "flex", flexDirection: "column", gap: 2 }}
    >
      <TextField
        label="Ad"
        size="small"
        required
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />
      <TextField
        label="Soyad"
        size="small"
        required
        value={formData.surname}
        onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
      />
      <TextField
        label="Kurumsal E-posta"
        size="small"
        type="email"
        required
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
      />

      <FormControl size="small" required fullWidth>
        <InputLabel id="branch-modal-label">Görev Şubesi</InputLabel>
        <Select
          labelId="branch-modal-label"
          label="Görev Şubesi"
          value={formData.branchId}
          onChange={(e) =>
            setFormData({ ...formData, branchId: e.target.value })
          }
        >
          {branches.map((branch) => (
            <MenuItem key={branch.id} value={branch.id}>
              {branch.code} - {branch.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" required fullWidth>
        <InputLabel id="role-select-label">Rol Tanımla</InputLabel>
        <Select
          labelId="role-select-label"
          label="Rol Tanımla"
          value={formData.roleId}
          onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
        >
          {roles.map((role) => (
            <MenuItem key={role.id} value={role.id}>
              {roleDisplayNames[role.name] || role.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Button type="submit" variant="contained" sx={{ mt: 1 }}>
        Personeli Listeye Ekle
      </Button>
    </Box>
  );
};

// Router'ın aradığı ana sayfa export'u:
export const WhitelistPage: React.FC = () => {
  return <PersonnelManagement viewMode="whitelist" />;
};
