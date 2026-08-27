import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  InputAdornment,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  IconButton,
  Tooltip,
} from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import SearchIcon from "@mui/icons-material/Search";
import BadgeIcon from "@mui/icons-material/Badge";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import api from "../../services/api";
import type {
  Customer,
  CreateCustomerDTO,
  Branch,
} from "../../types/customer.types";
import { isValidTurkishId } from "../../utils/identityValidator";
import { useAuth } from "../../hooks/useAuth";

export const CustomersPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Müşteri Modal State
  const [isCustomerModalOpen, setIsCustomerModalOpen] =
    useState<boolean>(false);
  const [isCustomerSubmitting, setIsCustomerSubmitting] =
    useState<boolean>(false);
  const [customerFormData, setCustomerFormData] = useState<CreateCustomerDTO>({
    identityNumber: "",
    firstName: "",
    lastName: "",
    branchId: "",
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [custRes, branchRes] = await Promise.all([
        api.get<{ success: boolean; data: Customer[] }>("/customers"),
        api.get<{ success: boolean; data: Branch[] }>("/customers/branches"),
      ]);
      setCustomers(custRes.data.data);
      setBranches(branchRes.data.data);
    } catch (error: any) {
      console.error("Veriler çekilemedi:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCustomerModal = () => {
    setErrorMessage(null);
    setCustomerFormData({
      identityNumber: "",
      firstName: "",
      lastName: "",
      branchId:
        (user as any)?.branchId || (branches.length > 0 ? branches[0].id : ""),
    });
    setIsCustomerModalOpen(true);
  };

  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!isValidTurkishId(customerFormData.identityNumber)) {
      setErrorMessage(
        "Lütfen geçerli 11 haneli bir T.C. Kimlik Numarası giriniz.",
      );
      return;
    }

    try {
      setIsCustomerSubmitting(true);
      await api.post("/customers", customerFormData);
      setSuccessMessage("Müşteri kaydı başarıyla oluşturuldu.");
      setIsCustomerModalOpen(false);
      fetchData();
    } catch (error: any) {
      setErrorMessage(
        error.response?.data?.message ||
          "Müşteri kaydedilirken bir hata oluştu.",
      );
    } finally {
      setIsCustomerSubmitting(false);
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.identityNumber.includes(searchTerm) ||
      c.customerNumber.toString().includes(searchTerm) ||
      `${c.firstName} ${c.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()),
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <div>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Müşteri Yönetimi
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Banka müşterilerini görüntüleyebilir ve yeni müşteri kaydı
            oluşturabilirsiniz.
          </Typography>
        </div>
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={handleOpenCustomerModal}
          sx={{
            borderRadius: 2,
            px: 3,
            textTransform: "none",
            fontWeight: 600,
          }}
        >
          Yeni Müşteri Ekle
        </Button>
      </Box>

      {successMessage && (
        <Alert
          severity="success"
          sx={{ mb: 3 }}
          onClose={() => setSuccessMessage(null)}
        >
          {successMessage}
        </Alert>
      )}

      {/* Arama Alanı */}
      <Card
        sx={{
          mb: 3,
          borderRadius: 3,
          boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
        }}
      >
        <CardContent sx={{ p: 2 }}>
          <TextField
            fullWidth
            placeholder="Müşteri No, TC Kimlik No veya İsim ile ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              },
            }}
          />
        </CardContent>
      </Card>

      {/* Müşteri Tablosu */}
      <TableContainer
        component={Paper}
        sx={{ borderRadius: 3, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}
      >
        <Table>
          <TableHead sx={{ bgcolor: "#f8fafc" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Müşteri No</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>T.C. Kimlik No</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Ad Soyad</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Kayıt Şubesi</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Durum</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">
                Hesap Yönetimi
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={32} />
                </TableCell>
              </TableRow>
            ) : filteredCustomers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  align="center"
                  sx={{ py: 4, color: "text.secondary" }}
                >
                  Kayıtlı müşteri bulunamadı.
                </TableCell>
              </TableRow>
            ) : (
              filteredCustomers.map((customer) => (
                <TableRow key={customer.id} hover>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <BadgeIcon fontSize="small" color="primary" />
                      <Typography sx={{ fontWeight: 600 }}>
                        {customer.customerNumber}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{customer.identityNumber}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>
                    {customer.firstName} {customer.lastName}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={`${customer.branch?.code || ""} - ${customer.branch?.name || "Bilinmiyor"}`}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={customer.isActive ? "Aktif" : "Pasif"}
                      color={customer.isActive ? "success" : "default"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Vadesiz Hesaplarını Yönet">
                      <IconButton
                        color="primary"
                        onClick={() =>
                          navigate(
                            `/dashboard/demand-accounts?customerId=${customer.id}`,
                          )
                        }
                        size="small"
                      >
                        <AccountBalanceWalletIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* YENİ MÜŞTERİ MODALI */}
      <Dialog
        open={isCustomerModalOpen}
        onClose={() => !isCustomerSubmitting && setIsCustomerModalOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3, p: 1 } } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Yeni Müşteri Kaydı</DialogTitle>
        <form onSubmit={handleCustomerSubmit}>
          <DialogContent
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
            <TextField
              label="T.C. Kimlik Numarası"
              name="identityNumber"
              value={customerFormData.identityNumber}
              onChange={(e) =>
                setCustomerFormData((prev) => ({
                  ...prev,
                  identityNumber: e.target.value
                    .replace(/\D/g, "")
                    .slice(0, 11),
                }))
              }
              fullWidth
              required
            />
            <TextField
              label="Müşteri Adı"
              value={customerFormData.firstName}
              onChange={(e) =>
                setCustomerFormData((prev) => ({
                  ...prev,
                  firstName: e.target.value,
                }))
              }
              fullWidth
              required
            />
            <TextField
              label="Müşteri Soyadı"
              value={customerFormData.lastName}
              onChange={(e) =>
                setCustomerFormData((prev) => ({
                  ...prev,
                  lastName: e.target.value,
                }))
              }
              fullWidth
              required
            />
            <FormControl fullWidth size="small">
              <InputLabel>Müşteri Şubesi</InputLabel>
              <Select
                value={customerFormData.branchId}
                label="Müşteri Şubesi"
                onChange={(e) =>
                  setCustomerFormData((prev) => ({
                    ...prev,
                    branchId: Number(e.target.value),
                  }))
                }
              >
                {branches.map((b) => (
                  <MenuItem key={b.id} value={b.id}>
                    {b.code} - {b.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button
              onClick={() => setIsCustomerModalOpen(false)}
              color="inherit"
            >
              İptal
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isCustomerSubmitting}
            >
              {isCustomerSubmitting ? <CircularProgress size={24} /> : "Kaydet"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};
