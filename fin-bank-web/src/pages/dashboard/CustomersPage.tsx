import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
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
import { AgGridReact } from "ag-grid-react";
import type { ColDef } from "ag-grid-community";
import api from "../../services/api";
import type {
  Customer,
  CreateCustomerDTO,
  Branch,
} from "../../types/customer.types";
import { isValidTurkishId } from "../../utils/identityValidator";
import { useAuth } from "../../hooks/useAuth";
import PaymentsIcon from "@mui/icons-material/Payments";

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

  const filteredCustomers = useMemo(() => {
    return customers.filter(
      (c) =>
        c.identityNumber.includes(searchTerm) ||
        c.customerNumber.toString().includes(searchTerm) ||
        `${c.firstName} ${c.lastName}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase()),
    );
  }, [customers, searchTerm]);

  // AG Grid Kolon Tanımları
  const columnDefs = useMemo<ColDef<Customer>[]>(
    () => [
      {
        headerName: "Müşteri No",
        field: "customerNumber",
        flex: 1,
        cellRenderer: (params: any) => (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              height: "100%",
            }}
          >
            <BadgeIcon fontSize="small" color="primary" />
            <Typography sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
              {params.value}
            </Typography>
          </Box>
        ),
      },
      {
        headerName: "T.C. Kimlik No",
        field: "identityNumber",
        flex: 1,
      },
      {
        headerName: "Ad Soyad",
        valueGetter: (params) =>
          `${params.data?.firstName || ""} ${params.data?.lastName || ""}`,
        cellStyle: { fontWeight: 600 },
        flex: 1.2,
      },
      {
        headerName: "Kayıt Şubesi",
        field: "branch",
        flex: 1.2,
        cellRenderer: (params: any) => {
          const branch = params.data?.branch;
          return (
            <Chip
              label={`${branch?.code || ""} - ${branch?.name || "Bilinmiyor"}`}
              size="small"
              variant="outlined"
            />
          );
        },
      },
      {
        headerName: "Durum",
        field: "isActive",
        flex: 0.8,
        cellRenderer: (params: any) => (
          <Chip
            label={params.value ? "Aktif" : "Pasif"}
            color={params.value ? "success" : "default"}
            size="small"
          />
        ),
      },
      {
        headerName: "İşlemler",
        field: "id",
        flex: 1.2,
        sortable: false,
        filter: false,
        cellClass: "ag-cell-center",
        headerClass: "ag-header-cell-center",
        cellRenderer: (params: any) => (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              gap: 1,
              alignItems: "center",
              height: "100%",
            }}
          >
            {/* 1. Vadesiz Hesaplar Butonu */}
            <Tooltip title="Vadesiz Hesaplarını Yönet">
              <IconButton
                color="primary"
                onClick={() =>
                  navigate(
                    `/dashboard/demand-accounts?customerId=${params.value}`,
                  )
                }
                size="small"
              >
                <AccountBalanceWalletIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {/* 2. Gişe / Nakit Para İşlemleri Butonu */}
            <Tooltip title="Gişe / Para İşlemleri Yap">
              <IconButton
                sx={{ color: "#16a34a" }}
                onClick={() =>
                  navigate(
                    `/dashboard/cashier/withdraw?customerId=${params.value}`,
                  )
                }
                size="small"
              >
                <PaymentsIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        ),
      },
    ],
    [navigate],
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

      {/* AG Grid Müşteri Tablosu */}
      <Card
        sx={{
          borderRadius: 3,
          boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
          overflow: "hidden",
        }}
      >
        <div className="ag-theme-alpine" style={{ height: 500, width: "100%" }}>
          <AgGridReact
            rowData={filteredCustomers}
            columnDefs={columnDefs}
            loading={isLoading}
            pagination={true}
            paginationPageSize={10}
            paginationPageSizeSelector={[10, 20, 50]}
            animateRows={true}
            overlayNoRowsTemplate="<span>Kayıtlı müşteri bulunamadı.</span>"
          />
        </div>
      </Card>

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
