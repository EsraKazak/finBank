import React, { useState, useEffect, useMemo, useCallback } from "react";
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
} from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import SearchIcon from "@mui/icons-material/Search";
import BadgeIcon from "@mui/icons-material/Badge";
import { AgGridReact } from "ag-grid-react";
import {
  themeAlpine,
  type ColDef,
  type PaginationChangedEvent,
} from "ag-grid-community";
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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Sayfalama State'leri
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

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

  // Şubeleri 1 kez çek
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await api.get<{ success: boolean; data: Branch[] }>(
          "/customers/branches",
        );
        setBranches(res.data.data);
      } catch (err) {
        console.error("Şubeler alınamadı:", err);
      }
    };
    fetchBranches();
  }, []);

  // Sunucudan Sayfalanmış Veriyi Çekme Fonksiyonu
  const fetchPaginatedCustomers = useCallback(
    async (currentPage: number, currentLimit: number, search: string) => {
      try {
        setIsLoading(true);
        const res = await api.get<{
          success: boolean;
          data: Customer[];
          pagination: { total: number };
        }>("/customers", {
          params: {
            page: currentPage,
            limit: currentLimit,
            search: search.trim() || undefined,
          },
        });

        setCustomers(res.data.data || []);
      } catch (error: any) {
        console.error("Müşteri listesi çekilemedi:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  // Sayfa, Limit veya Arama değiştiğinde sunucudan veri çek (Debounce: 350ms)
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchPaginatedCustomers(page, pageSize, searchTerm);
    }, 350);

    return () => clearTimeout(delayDebounceFn);
  }, [page, pageSize, searchTerm, fetchPaginatedCustomers]);

  // AG Grid sayfalama butonuna basıldığında
  const onPaginationChanged = (event: PaginationChangedEvent) => {
    if (!event.api) return;
    const newPage = event.api.paginationGetCurrentPage() + 1;
    const newPageSize = event.api.paginationGetPageSize();

    if (newPage !== page) {
      setPage(newPage);
    }
    if (newPageSize !== pageSize) {
      setPageSize(newPageSize);
      setPage(1);
    }
  };

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
      setErrorMessage("Lütfen geçerli 11 haneli bir T.C. Kimlik No giriniz.");
      return;
    }

    try {
      setIsCustomerSubmitting(true);
      await api.post("/customers", customerFormData);
      setSuccessMessage("Müşteri kaydı başarıyla oluşturuldu.");
      setIsCustomerModalOpen(false);
      fetchPaginatedCustomers(1, pageSize, searchTerm);
    } catch (error: any) {
      setErrorMessage(
        error.response?.data?.message ||
          "Müşteri kaydedilirken bir hata oluştu.",
      );
    } finally {
      setIsCustomerSubmitting(false);
    }
  };

  const columnDefs = useMemo<ColDef<Customer>[]>(
    () => [
      {
        headerName: "Müşteri No",
        field: "customerNumber",
        width: 140,
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
            <Typography sx={{ fontWeight: 700, fontSize: "0.875rem" }}>
              {params.value}
            </Typography>
          </Box>
        ),
      },
      {
        headerName: "T.C. Kimlik No",
        field: "identityNumber",
        width: 150,
        cellRenderer: (params: any) => (
          <Typography
            sx={{
              fontFamily: "monospace",
              fontSize: "0.85rem",
              fontWeight: 600,
            }}
          >
            {params.value}
          </Typography>
        ),
      },
      {
        headerName: "Ad Soyad",
        valueGetter: (params) =>
          `${params.data?.firstName || ""} ${params.data?.lastName || ""}`,
        cellStyle: { fontWeight: 600 },
        flex: 1.2,
        minWidth: 160,
      },
      {
        headerName: "Kayıt Şubesi",
        field: "branch",
        valueGetter: (params) => params.data?.branch?.name || "-",
        flex: 1.1,
        minWidth: 150,
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
        width: 100,
        cellRenderer: (params: any) => (
          <Chip
            label={params.value ? "Aktif" : "Pasif"}
            color={params.value ? "success" : "default"}
            size="small"
            sx={{ fontWeight: 600, fontSize: 11 }}
          />
        ),
      },
      {
        headerName: "Hızlı İşlemler",
        field: "id",
        width: 250,
        pinned: "right",
        sortable: false,
        filter: false,
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
            <Button
              variant="contained"
              size="small"
              onClick={() =>
                navigate(`/dashboard/customers/${params.data.id}/accounts`, {
                  state: { customer: params.data },
                })
              }
            >
              Hesaplar & İşlemler
            </Button>
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
            Banka müşterilerini görüntüleyebilir, hesaplarını yönetebilir veya
            yeni müşteri kaydedebilirsiniz.
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
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
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
        <div style={{ height: 600, width: "100%" }}>
          <AgGridReact
            theme={themeAlpine}
            rowData={customers}
            columnDefs={columnDefs}
            loading={isLoading}
            pagination={true}
            paginationPageSize={pageSize}
            paginationPageSizeSelector={[10, 20, 50]}
            onPaginationChanged={onPaginationChanged}
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
