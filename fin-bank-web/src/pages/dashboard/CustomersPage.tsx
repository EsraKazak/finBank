import React, { useState, useEffect } from "react";
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
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import api from "../../services/api";
import type {
  Customer,
  CreateCustomerDTO,
  Branch,
} from "../../types/customer.types";
import type {
  Product,
  Account,
  OpenAccountDTO,
  AccountStatus,
} from "../../types/account.types";
import { isValidTurkishId } from "../../utils/identityValidator";
import { useAuth } from "../../hooks/useAuth";

export const CustomersPage: React.FC = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [accountToClose, setAccountToClose] = useState<Account | null>(null);

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

  // Hesap Açılış Modal State
  const [isAccountModalOpen, setIsAccountModalOpen] = useState<boolean>(false);
  const [selectedCustomerForAccount, setSelectedCustomerForAccount] =
    useState<Customer | null>(null);
  const [isAccountSubmitting, setIsAccountSubmitting] =
    useState<boolean>(false);
  const [accountFormData, setAccountFormData] = useState<OpenAccountDTO>({
    customerId: 0,
    productId: "",
    name: "",
    interestRate: "",
    renewalType: "",
    maturityDays: "",
  });

  // Müşteri Hesapları Görüntüleme State
  const [isAccountListOpen, setIsAccountListOpen] = useState<boolean>(false);
  const [customerAccounts, setCustomerAccounts] = useState<Account[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState<boolean>(false);
  const [statusActionLoadingId, setStatusActionLoadingId] = useState<
    number | null
  >(null);

  // Bildirim Mesajları
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [custRes, branchRes, prodRes] = await Promise.all([
        api.get<{ success: boolean; data: Customer[] }>("/customers"),
        api.get<{ success: boolean; data: Branch[] }>("/customers/branches"),
        api.get<{ success: boolean; data: Product[] }>("/accounts/products"),
      ]);
      setCustomers(custRes.data.data);
      setBranches(branchRes.data.data);
      setProducts(prodRes.data.data);
    } catch (error: any) {
      console.error("Veriler çekilemedi:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Müşteri İşlemleri ---
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

  // --- Hesap Açma İşlemleri ---
  const handleOpenAccountModal = (customer: Customer) => {
    setSelectedCustomerForAccount(customer);
    setErrorMessage(null);
    setAccountFormData({
      customerId: customer.id,
      productId: "",
      name: `${customer.firstName} Vadesiz Hesap`,
      interestRate: "",
      renewalType: "",
      maturityDays: "",
    });
    setIsAccountModalOpen(true);
  };

  const selectedProduct = products.find(
    (p) => p.id === Number(accountFormData.productId),
  );

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!accountFormData.productId || !accountFormData.name.trim()) {
      setErrorMessage("Lütfen ürün seçimi ve hesap adı alanlarını doldurunuz.");
      return;
    }

    try {
      setIsAccountSubmitting(true);
      await api.post("/accounts", accountFormData);
      setSuccessMessage("Hesap başarıyla açıldı.");
      setIsAccountModalOpen(false);
    } catch (error: any) {
      setErrorMessage(
        error.response?.data?.message || "Hesap açılırken bir hata oluştu.",
      );
    } finally {
      setIsAccountSubmitting(false);
    }
  };

  // --- Müşteri Hesaplarını Görüntüleme & Durum Güncelleme ---
  const fetchCustomerAccounts = async (customerId: number) => {
    try {
      setIsLoadingAccounts(true);
      const res = await api.get<{ success: boolean; data: Account[] }>(
        `/accounts/customer/${customerId}`,
      );
      setCustomerAccounts(res.data.data);
    } catch (error: any) {
      console.error("Hesaplar alınamadı:", error);
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  const handleViewAccounts = (customer: Customer) => {
    setSelectedCustomerForAccount(customer);
    setIsAccountListOpen(true);
    fetchCustomerAccounts(customer.id);
  };

  const handleUpdateStatus = async (
    accountId: number,
    status: AccountStatus,
  ) => {
    try {
      setStatusActionLoadingId(accountId);
      await api.patch(`/accounts/${accountId}/status`, { status });
      if (selectedCustomerForAccount) {
        await fetchCustomerAccounts(selectedCustomerForAccount.id);
      }
    } catch (error: any) {
      alert(error.response?.data?.message || "Durum güncellenemedi.");
    } finally {
      setStatusActionLoadingId(null);
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
            Müşteri ve Hesap Yönetimi
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Banka müşterilerini yönetebilir, yeni hesaplar tanımlayabilir veya
            mevcut hesap durumlarını güncelleyebilirsiniz.
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
              <TableCell sx={{ fontWeight: 700 }}>Ana Şube</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Durum</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">
                İşlemler
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
                      label={`${customer.branch?.code || ""} - ${customer.branch?.name || ""}`}
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
                    <Tooltip title="Yeni Hesap Aç">
                      <IconButton
                        color="primary"
                        onClick={() => handleOpenAccountModal(customer)}
                        size="small"
                      >
                        <AccountBalanceWalletIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Hesapları Görüntüle & Yönet">
                      <IconButton
                        color="secondary"
                        onClick={() => handleViewAccounts(customer)}
                        size="small"
                        sx={{ ml: 1 }}
                      >
                        <FormatListBulletedIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 1. MÜŞTERİ EKLEME MODALI */}
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

      {/* 2. HESAP AÇILIŞ MODALI (Uyarı metni kaldırıldı) */}
      <Dialog
        open={isAccountModalOpen}
        onClose={() => !isAccountSubmitting && setIsAccountModalOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3, p: 1 } } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Hesap Açılışı — {selectedCustomerForAccount?.firstName}{" "}
          {selectedCustomerForAccount?.lastName}
        </DialogTitle>
        <form onSubmit={handleAccountSubmit}>
          <DialogContent
            sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}
          >
            {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

            <TextField
              label="Hesap Adı / Tanımı"
              value={accountFormData.name}
              onChange={(e) =>
                setAccountFormData((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
              fullWidth
              required
            />

            <FormControl fullWidth>
              <InputLabel>Banka Ürünü Seçin</InputLabel>
              <Select
                value={accountFormData.productId}
                label="Banka Ürünü Seçin"
                onChange={(e) => {
                  const prod = products.find(
                    (p) => p.id === Number(e.target.value),
                  );
                  setAccountFormData((prev) => ({
                    ...prev,
                    productId: Number(e.target.value),
                    interestRate: prod?.minInterest || "",
                    maturityDays: prod?.type === "TIME" ? 32 : "",
                    renewalType:
                      prod?.type === "TIME" ? "PRINCIPAL_AND_INTEREST" : "",
                  }));
                }}
                required
              >
                {products.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name} ({p.currency} -{" "}
                    {p.type === "TIME" ? "Vadeli" : "Vadesiz"})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* SADECE VADELİ SEÇİLDİYSE GÖRÜNEN ALANLAR */}
            {selectedProduct?.type === "TIME" && (
              <Box
                sx={{
                  p: 2,
                  bgcolor: "#f1f5f9",
                  borderRadius: 2,
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 700, color: "#1e293b" }}
                >
                  Vadeli Hesap Parametreleri
                </Typography>

                <TextField
                  label="Faiz Oranı (%)"
                  type="number"
                  value={accountFormData.interestRate}
                  onChange={(e) =>
                    setAccountFormData((prev) => ({
                      ...prev,
                      interestRate: Number(e.target.value),
                    }))
                  }
                  helperText={`Faiz Aralığı: %${selectedProduct.minInterest || 0} - %${selectedProduct.maxInterest || 0}`}
                  fullWidth
                  required
                />

                <TextField
                  label="Vade Gün Sayısı"
                  type="number"
                  value={accountFormData.maturityDays}
                  onChange={(e) =>
                    setAccountFormData((prev) => ({
                      ...prev,
                      maturityDays: Number(e.target.value),
                    }))
                  }
                  helperText="Örn: 32 gün"
                  fullWidth
                  required
                />

                <FormControl fullWidth size="small">
                  <InputLabel>Temdit Tipi</InputLabel>
                  <Select
                    value={accountFormData.renewalType}
                    label="Temdit Tipi"
                    onChange={(e) =>
                      setAccountFormData((prev) => ({
                        ...prev,
                        renewalType: e.target.value as any,
                      }))
                    }
                    required
                  >
                    <MenuItem value="PRINCIPAL_AND_INTEREST">
                      Anapara + Faiz Yenile (Otomatik Uzat)
                    </MenuItem>
                    <MenuItem value="PRINCIPAL_ONLY">
                      Sadece Anapara Yenile (Faiz vadesize aktarılır)
                    </MenuItem>
                    <MenuItem value="CLOSE">Vade Sonunda Hesabı Kapat</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button
              onClick={() => setIsAccountModalOpen(false)}
              color="inherit"
            >
              İptal
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isAccountSubmitting}
            >
              {isAccountSubmitting ? (
                <CircularProgress size={24} />
              ) : (
                "Hesabı Aç"
              )}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* 3. MÜŞTERİ HESAPLARI LİSTESİ & DURUM YÖNETİMİ MODALI */}
      <Dialog
        open={isAccountListOpen}
        onClose={() => setIsAccountListOpen(false)}
        maxWidth="lg"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3, p: 1 } } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {selectedCustomerForAccount?.firstName}{" "}
          {selectedCustomerForAccount?.lastName} — Hesapları
        </DialogTitle>
        <DialogContent>
          {isLoadingAccounts ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : customerAccounts.length === 0 ? (
            <Alert severity="info">
              Bu müşteriye ait henüz bir hesap açılmamıştır.
            </Alert>
          ) : (
            <TableContainer
              component={Paper}
              variant="outlined"
              sx={{ borderRadius: 2 }}
            >
              <Table>
                <TableHead sx={{ bgcolor: "#f8fafc" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Ek No</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Hesap Adı</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>IBAN</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Bakiye</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Tür / Faiz</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Durum</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">
                      Hesap İşlemleri
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {customerAccounts.map((acc) => {
                    const isClosed = acc.status === "CLOSED";
                    const isBlocked = acc.status === "BLOCKED";

                    return (
                      <TableRow
                        key={acc.id}
                        hover
                        sx={{
                          bgcolor: isClosed ? "#f8fafc" : "inherit",
                          opacity: isClosed ? 0.65 : 1,
                        }}
                      >
                        <TableCell sx={{ fontWeight: 600 }}>
                          {acc.accountNumber}
                        </TableCell>
                        <TableCell>{acc.name}</TableCell>
                        <TableCell
                          sx={{ fontFamily: "monospace", fontSize: 13 }}
                        >
                          {acc.iban}
                        </TableCell>
                        <TableCell
                          sx={{
                            fontWeight: 700,
                            color: isClosed ? "text.disabled" : "success.main",
                          }}
                        >
                          {Number(acc.balance).toLocaleString("tr-TR", {
                            minimumFractionDigits: 2,
                          })}{" "}
                          {acc.currency}
                        </TableCell>
                        <TableCell>
                          {acc.product?.type === "TIME" ? (
                            <Chip
                              label={`Vadeli (%${acc.interestRate})`}
                              size="small"
                              color="warning"
                            />
                          ) : (
                            <Chip
                              label="Vadesiz"
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={
                              acc.status === "ACTIVE"
                                ? "Aktif"
                                : acc.status === "BLOCKED"
                                  ? "Bloke"
                                  : "Kapalı"
                            }
                            color={
                              acc.status === "ACTIVE"
                                ? "success"
                                : acc.status === "BLOCKED"
                                  ? "warning"
                                  : "default"
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          {statusActionLoadingId === acc.id ? (
                            <CircularProgress size={20} />
                          ) : isClosed ? (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Kapatıldı (Salt Okunur)
                            </Typography>
                          ) : (
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "center",
                                gap: 0.5,
                              }}
                            >
                              {isBlocked ? (
                                <Tooltip title="Blokeyi Kaldır (Aktif Yap)">
                                  <IconButton
                                    size="small"
                                    color="success"
                                    onClick={() =>
                                      handleUpdateStatus(acc.id, "ACTIVE")
                                    }
                                  >
                                    <CheckCircleIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              ) : (
                                <Tooltip title="Hesabı Bloke Et">
                                  <IconButton
                                    size="small"
                                    color="warning"
                                    onClick={() =>
                                      handleUpdateStatus(acc.id, "BLOCKED")
                                    }
                                  >
                                    <BlockIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                              <Tooltip title="Hesabı Kapat (Geri Alınamaz)">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => setAccountToClose(acc)}
                                >
                                  <CancelOutlinedIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setIsAccountListOpen(false)}
            variant="contained"
          >
            Kapat
          </Button>
        </DialogActions>
      </Dialog>
      {/* HESAP KAPATMA ONAY DİYALOĞU */}
      <Dialog
        open={Boolean(accountToClose)}
        onClose={() => setAccountToClose(null)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: 3,
              p: 1.5,
              textAlign: "center",
            },
          },
        }}
      >
        <DialogContent
          sx={{
            pt: 3,
            pb: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              bgcolor: "#fef2f2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 2,
            }}
          >
            <WarningAmberRoundedIcon sx={{ fontSize: 32, color: "#dc2626" }} />
          </Box>

          <Typography
            variant="h6"
            sx={{ fontWeight: 700, color: "#1e293b", mb: 1 }}
          >
            Hesabı Kapatmak İstiyor Musunuz?
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ lineHeight: 1.6 }}
          >
            <strong style={{ color: "#0f172a" }}>
              {accountToClose?.accountNumber}
            </strong>{" "}
            nolu hesabı kapatmak üzeresiniz. Bu işlem{" "}
            <strong>geri alınamaz</strong> ve hesap tüm finansal hareketlere
            kapatılarak salt okunur duruma getirilecektir.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ p: 2, justifyContent: "center", gap: 1.5 }}>
          <Button
            onClick={() => setAccountToClose(null)}
            variant="outlined"
            color="inherit"
            sx={{
              borderRadius: 2,
              textTransform: "none",
              px: 3,
              borderColor: "#cbd5e1",
            }}
          >
            Vazgeç
          </Button>
          <Button
            onClick={async () => {
              if (accountToClose) {
                const accId = accountToClose.id;
                setAccountToClose(null);
                await handleUpdateStatus(accId, "CLOSED");
              }
            }}
            variant="contained"
            color="error"
            sx={{
              borderRadius: 2,
              textTransform: "none",
              px: 3,
              boxShadow: "0 4px 12px rgba(220, 38, 38, 0.25)",
            }}
          >
            Evet, Hesabı Kapat
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
