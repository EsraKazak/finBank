import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
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
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import PersonIcon from "@mui/icons-material/Person";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import EditIcon from "@mui/icons-material/Edit";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import api from "../../services/api";
import type { Customer } from "../../types/customer.types";
import type {
  Product,
  Currency,
  ProductCurrency,
  Account,
  AccountStatus,
} from "../../types/account.types";
import { ReceiptPrintModal } from "../../components/ReceiptPrintModal";
import type { IReceiptData } from "../../components/ReceiptPrintModal";

export const DemandAccountsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const customerIdParam = searchParams.get("customerId");

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // Form State'leri
  const [openAccountName, setOpenAccountName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Parametrik Tanımlar
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [selectedCurrencyId, setSelectedCurrencyId] = useState<number | "">("");
  const [demandProductId, setDemandProductId] = useState<number | null>(null);

  // Güncelleme Modal State
  const [accountToEdit, setAccountToEdit] = useState<Account | null>(null);
  const [editAccountName, setEditAccountName] = useState("");

  // Kapatma Modal State
  const [accountToClose, setAccountToClose] = useState<Account | null>(null);

  // Fiş / Dekont Yazdırma Modal State'leri
  const [openReceiptModal, setOpenReceiptModal] = useState<boolean>(false);
  const [selectedReceipt, setSelectedReceipt] = useState<IReceiptData | null>(
    null,
  );

  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Parametreleri (Ürünler ve Para Birimleri) Çek
  useEffect(() => {
    const fetchParams = async () => {
      try {
        const res = await api.get<{
          success: boolean;
          data: {
            products: Product[];
            currencies: Currency[];
            productCurrencies: ProductCurrency[];
          };
        }>("/accounts/parameters");

        const demandProd = res.data.data.products.find(
          (p) => p.type === "DEMAND",
        );
        if (demandProd) {
          setDemandProductId(demandProd.id);
        }
        setCurrencies(res.data.data.currencies);
        if (res.data.data.currencies.length > 0) {
          setSelectedCurrencyId(res.data.data.currencies[0].id);
        }
      } catch (err) {
        console.error("Parametreler alınamadı:", err);
      }
    };
    fetchParams();
  }, []);

  // URL'den Müşteri ID gelmişse otomatik yükle
  useEffect(() => {
    if (customerIdParam) {
      loadCustomerById(Number(customerIdParam));
    }
  }, [customerIdParam]);

  const loadCustomerById = async (id: number) => {
    try {
      setIsSearching(true);
      const res = await api.get<{ success: boolean; data: Customer[] }>(
        "/customers",
      );
      const found = res.data.data.find((c) => c.id === id);
      if (found) {
        setSelectedCustomer(found);
        setOpenAccountName(`${found.firstName} Vadesiz Hesap`);
        loadAccounts(found.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setIsSearching(true);
      setNotification(null);
      const res = await api.get<{ success: boolean; data: Customer[] }>(
        "/customers",
      );
      const found = res.data.data.find(
        (c) =>
          c.identityNumber === searchQuery.trim() ||
          c.customerNumber.toString() === searchQuery.trim(),
      );

      if (found) {
        setSelectedCustomer(found);
        setSearchParams({ customerId: found.id.toString() });
        setOpenAccountName(`${found.firstName} Vadesiz Hesap`);
        loadAccounts(found.id);
      } else {
        setNotification({
          type: "error",
          message:
            "Müşteri bulunamadı. Lütfen TC veya Müşteri No kontrol ediniz.",
        });
      }
    } catch (err: any) {
      setNotification({
        type: "error",
        message: "Arama sırasında bir hata oluştu.",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const loadAccounts = async (customerId: number) => {
    try {
      setLoadingAccounts(true);
      const res = await api.get<{ success: boolean; data: Account[] }>(
        `/accounts/customer/${customerId}`,
      );
      const vadesizler = res.data.data.filter(
        (a) => a.product?.type === "DEMAND",
      );
      setAccounts(vadesizler);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAccounts(false);
    }
  };

  // Hesabın son kesilen fişini yükleyip modalı açan fonksiyon
  const handleOpenAccountReceipt = async (accountId: number) => {
    try {
      const res = await api.get(`/accounting?accountId=${accountId}`);
      const records = res.data.data;
      if (records && records.length > 0) {
        setSelectedReceipt(records[0]);
        setOpenReceiptModal(true);
      } else {
        alert("Bu hesaba ait henüz bir işlem fişi bulunmuyor.");
      }
    } catch (error) {
      alert("Fiş yüklenirken bir hata oluştu.");
    }
  };

  // Yeni Vadesiz Hesap Açılışı
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !selectedCustomer ||
      !demandProductId ||
      !selectedCurrencyId ||
      !openAccountName.trim()
    )
      return;

    try {
      setIsSubmitting(true);
      const createRes = await api.post("/accounts", {
        customerId: selectedCustomer.id,
        productId: demandProductId,
        currencyId: selectedCurrencyId,
        name: openAccountName,
      });

      setNotification({
        type: "success",
        message: "Vadesiz hesap başarıyla açıldı.",
      });

      // Açılan hesabın fişini hemen getirip modalı aç
      const newAccountId = createRes.data.data?.id || createRes.data.id;
      if (newAccountId) {
        handleOpenAccountReceipt(newAccountId);
      }

      loadAccounts(selectedCustomer.id);
      setActiveTab(1);
    } catch (err: any) {
      setNotification({
        type: "error",
        message: err.response?.data?.message || "Hesap açılamadı.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Hesap Adı Güncelleme
  const handleSaveRename = async () => {
    if (!accountToEdit || !editAccountName.trim()) return;
    try {
      await api.patch(`/accounts/${accountToEdit.id}/name`, {
        name: editAccountName,
      });
      setNotification({ type: "success", message: "Hesap adı güncellendi." });
      setAccountToEdit(null);
      if (selectedCustomer) loadAccounts(selectedCustomer.id);
    } catch (err: any) {
      alert(err.response?.data?.message || "Güncelleme başarısız.");
    }
  };

  // Durum Değiştirme (Bloke / Kapatma)
  const handleUpdateStatus = async (
    accountId: number,
    status: AccountStatus,
  ) => {
    try {
      await api.patch(`/accounts/${accountId}/status`, { status });
      setNotification({
        type: "success",
        message: "Hesap durumu başarıyla güncellendi.",
      });

      // Durum değişikliği sonrası kesilen fişi göster
      handleOpenAccountReceipt(accountId);

      if (selectedCustomer) loadAccounts(selectedCustomer.id);
    } catch (err: any) {
      alert(err.response?.data?.message || "İşlem başarısız.");
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
        Vadesiz Hesap Yönetimi
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Müşteri bazlı vadesiz hesap açılışı, tanım güncelleme ve hesap
        kapatma/bloke işlemlerini gerçekleştirebilirsiniz.
      </Typography>

      {notification && (
        <Alert
          severity={notification.type}
          sx={{ mb: 3 }}
          onClose={() => setNotification(null)}
        >
          {notification.message}
        </Alert>
      )}

      {/* MÜŞTERİ ARAMA KARTI */}
      <Card
        sx={{
          mb: 3,
          borderRadius: 3,
          boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
        }}
      >
        <CardContent sx={{ p: 2.5 }}>
          <form onSubmit={handleSearchCustomer}>
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Müşteri çağırmak için 11 Haneli T.C. Kimlik No veya 8 Haneli Müşteri No giriniz..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
              <Button
                type="submit"
                variant="contained"
                disabled={isSearching}
                sx={{
                  minWidth: 130,
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 600,
                }}
              >
                {isSearching ? (
                  <CircularProgress size={22} color="inherit" />
                ) : (
                  "Müşteri Bul"
                )}
              </Button>
            </Box>
          </form>

          {/* Seçili Müşteri Özet Paneli */}
          {selectedCustomer && (
            <Box
              sx={{
                mt: 2.5,
                p: 2,
                borderRadius: 2,
                bgcolor: "#f8fafc",
                border: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 2,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2,
                    bgcolor: "#e0f2fe",
                    color: "#0284c7",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <PersonIcon />
                </Box>
                <div>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 700, color: "#0f172a" }}
                  >
                    {selectedCustomer.firstName} {selectedCustomer.lastName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Müşteri No:{" "}
                    <strong>{selectedCustomer.customerNumber}</strong> | T.C.:{" "}
                    <strong>{selectedCustomer.identityNumber}</strong>
                  </Typography>
                </div>
              </Box>

              <Chip
                label={`Kayıt Şubesi: ${selectedCustomer.branch?.code || ""} - ${selectedCustomer.branch?.name || ""}`}
                variant="outlined"
                sx={{ fontWeight: 600 }}
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* İŞLEM SEKMELERİ */}
      {selectedCustomer ? (
        <Card
          sx={{ borderRadius: 3, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}
        >
          <Box sx={{ borderBottom: 1, borderColor: "divider", px: 2, pt: 1 }}>
            <Tabs value={activeTab} onChange={(_e, val) => setActiveTab(val)}>
              <Tab
                label="Yeni Vadesiz Hesap Açılışı"
                sx={{ textTransform: "none", fontWeight: 600 }}
              />
              <Tab
                label="Mevcut Hesaplar & Güncelleme"
                sx={{ textTransform: "none", fontWeight: 600 }}
              />
              <Tab
                label="Hesap Durum & Kapatma"
                sx={{ textTransform: "none", fontWeight: 600 }}
              />
            </Tabs>
          </Box>

          <CardContent sx={{ p: 3 }}>
            {/* 1. SEKME: HESAP AÇILIŞI */}
            {activeTab === 0 && (
              <form onSubmit={handleCreateAccount}>
                <Box
                  sx={{
                    maxWidth: 500,
                    display: "flex",
                    flexDirection: "column",
                    gap: 2.5,
                  }}
                >
                  <Typography variant="subtitle2" color="text.secondary">
                    Seçili müşteri ({selectedCustomer.firstName}{" "}
                    {selectedCustomer.lastName}) adına dilediğiniz para
                    biriminde vadesiz hesap tanımlayabilirsiniz.
                  </Typography>

                  <TextField
                    label="Hesap Adı / Tanımı"
                    value={openAccountName}
                    onChange={(e) => setOpenAccountName(e.target.value)}
                    required
                    fullWidth
                    size="small"
                  />

                  <FormControl fullWidth size="small">
                    <InputLabel>Para Birimi (Döviz Cinsi)</InputLabel>
                    <Select
                      value={selectedCurrencyId}
                      label="Para Birimi (Döviz Cinsi)"
                      onChange={(e) => {
                        const cId = Number(e.target.value);
                        setSelectedCurrencyId(cId);
                        const curr = currencies.find((c) => c.id === cId);
                        if (curr && selectedCustomer) {
                          setOpenAccountName(
                            `${selectedCustomer.firstName} Vadesiz ${curr.code} Hesabı`,
                          );
                        }
                      }}
                      required
                    >
                      {currencies.map((c) => (
                        <MenuItem key={c.id} value={c.id}>
                          {c.code} — {c.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<AccountBalanceWalletIcon />}
                    disabled={isSubmitting}
                    sx={{
                      alignSelf: "flex-start",
                      borderRadius: 2,
                      px: 3,
                      textTransform: "none",
                      fontWeight: 600,
                    }}
                  >
                    {isSubmitting ? (
                      <CircularProgress size={22} color="inherit" />
                    ) : (
                      "Hesabı Aç"
                    )}
                  </Button>
                </Box>
              </form>
            )}

            {/* 2. SEKME: LİSTELEME & HESAP ADI GÜNCELLEME */}
            {activeTab === 1 && (
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
                      <TableCell sx={{ fontWeight: 700 }}>Durum</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">
                        İşlemler
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loadingAccounts ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                          <CircularProgress size={28} />
                        </TableCell>
                      </TableRow>
                    ) : accounts.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          align="center"
                          sx={{ py: 3, color: "text.secondary" }}
                        >
                          Kayıtlı vadesiz hesap bulunamadı.
                        </TableCell>
                      </TableRow>
                    ) : (
                      accounts.map((acc) => (
                        <TableRow key={acc.id} hover>
                          <TableCell sx={{ fontWeight: 600 }}>
                            {acc.accountNumber}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>
                            {acc.name}
                          </TableCell>
                          <TableCell
                            sx={{ fontFamily: "monospace", fontSize: 13 }}
                          >
                            {acc.iban}
                          </TableCell>
                          <TableCell
                            sx={{ fontWeight: 700, color: "success.main" }}
                          >
                            {Number(acc.balance).toLocaleString("tr-TR", {
                              minimumFractionDigits: 2,
                            })}{" "}
                            {acc.currency?.code || "TRY"}
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
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "center",
                                gap: 1,
                              }}
                            >
                              {/* Fiş / Dekont Butonu */}
                              <Tooltip title="Son İşlem Fişini / Dekontu Yazdır">
                                <IconButton
                                  size="small"
                                  color="secondary"
                                  onClick={() =>
                                    handleOpenAccountReceipt(acc.id)
                                  }
                                >
                                  <ReceiptLongIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>

                              {/* Düzenleme Butonu */}
                              {acc.status !== "CLOSED" && (
                                <Tooltip title="Hesap Adını Değiştir">
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={() => {
                                      setAccountToEdit(acc);
                                      setEditAccountName(acc.name);
                                    }}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* 3. SEKME: DURUM YÖNETİMİ & KAPATMA */}
            {activeTab === 2 && (
              <TableContainer
                component={Paper}
                variant="outlined"
                sx={{ borderRadius: 2 }}
              >
                <Table>
                  <TableHead sx={{ bgcolor: "#f8fafc" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Ek No</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>
                        Hesap Tanımı
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Bakiye</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>
                        Mevcut Durum
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">
                        Durum Aksiyonları
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loadingAccounts ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                          <CircularProgress size={28} />
                        </TableCell>
                      </TableRow>
                    ) : accounts.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          align="center"
                          sx={{ py: 3, color: "text.secondary" }}
                        >
                          Kayıtlı vadesiz hesap bulunamadı.
                        </TableCell>
                      </TableRow>
                    ) : (
                      accounts.map((acc) => {
                        const isClosed = acc.status === "CLOSED";
                        const isBlocked = acc.status === "BLOCKED";

                        return (
                          <TableRow
                            key={acc.id}
                            hover
                            sx={{ opacity: isClosed ? 0.6 : 1 }}
                          >
                            <TableCell sx={{ fontWeight: 600 }}>
                              {acc.accountNumber}
                            </TableCell>
                            <TableCell>{acc.name}</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>
                              {Number(acc.balance).toLocaleString("tr-TR", {
                                minimumFractionDigits: 2,
                              })}{" "}
                              {acc.currency?.code || "TRY"}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={
                                  isClosed
                                    ? "Kapalı"
                                    : isBlocked
                                      ? "Bloke"
                                      : "Aktif"
                                }
                                color={
                                  isClosed
                                    ? "default"
                                    : isBlocked
                                      ? "warning"
                                      : "success"
                                }
                                size="small"
                              />
                            </TableCell>
                            <TableCell align="center">
                              {isClosed ? (
                                <Box
                                  sx={{
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    gap: 1,
                                  }}
                                >
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    Kapatıldı
                                  </Typography>
                                  <Tooltip title="Kapanış Fişini Görüntüle">
                                    <IconButton
                                      size="small"
                                      color="secondary"
                                      onClick={() =>
                                        handleOpenAccountReceipt(acc.id)
                                      }
                                    >
                                      <ReceiptLongIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              ) : (
                                <Box
                                  sx={{
                                    display: "flex",
                                    justifyContent: "center",
                                    gap: 1,
                                  }}
                                >
                                  {isBlocked ? (
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      color="success"
                                      startIcon={<CheckCircleIcon />}
                                      onClick={() =>
                                        handleUpdateStatus(acc.id, "ACTIVE")
                                      }
                                      sx={{
                                        textTransform: "none",
                                        borderRadius: 1.5,
                                      }}
                                    >
                                      Blokeyi Kaldır
                                    </Button>
                                  ) : (
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      color="warning"
                                      startIcon={<BlockIcon />}
                                      onClick={() =>
                                        handleUpdateStatus(acc.id, "BLOCKED")
                                      }
                                      sx={{
                                        textTransform: "none",
                                        borderRadius: 1.5,
                                      }}
                                    >
                                      Bloke Et
                                    </Button>
                                  )}
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="error"
                                    startIcon={<CancelOutlinedIcon />}
                                    onClick={() => setAccountToClose(acc)}
                                    sx={{
                                      textTransform: "none",
                                      borderRadius: 1.5,
                                    }}
                                  >
                                    Hesabı Kapat
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
            )}
          </CardContent>
        </Card>
      ) : (
        <Alert severity="info">
          Lütfen işlem yapmak istediğiniz müşteriyi yukarıdaki arama alanından
          çağırınız veya Müşteri Yönetimi sayfasından bir müşteri seçiniz.
        </Alert>
      )}

      {/* HESAP ADI DÜZENLEME MODALI */}
      <Dialog
        open={Boolean(accountToEdit)}
        onClose={() => setAccountToEdit(null)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3, p: 1 } } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Hesap Adını Güncelle</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            label="Hesap Adı / Tanımı"
            fullWidth
            value={editAccountName}
            onChange={(e) => setEditAccountName(e.target.value)}
            size="small"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setAccountToEdit(null)} color="inherit">
            İptal
          </Button>
          <Button onClick={handleSaveRename} variant="contained">
            Kaydet
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
          paper: { sx: { borderRadius: 3, p: 1.5, textAlign: "center" } },
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
            Vadesiz Hesabı Kapatmak İstiyor Musunuz?
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
            sx={{ borderRadius: 2, textTransform: "none", px: 3 }}
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
            sx={{ borderRadius: 2, textTransform: "none", px: 3 }}
          >
            Evet, Hesabı Kapat
          </Button>
        </DialogActions>
      </Dialog>

      {/* MUHASEBE FİŞİ YAZDIRMA MODALI */}
      <ReceiptPrintModal
        open={openReceiptModal}
        onClose={() => setOpenReceiptModal(false)}
        data={selectedReceipt}
      />
    </Box>
  );
};
