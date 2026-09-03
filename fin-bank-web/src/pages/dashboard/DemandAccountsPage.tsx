import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Paper,
  Divider,
} from "@mui/material";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import EditIcon from "@mui/icons-material/Edit";
import BlockIcon from "@mui/icons-material/Block";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import api from "../../services/api";
import type { Customer } from "../../types/customer.types";
import type {
  Product,
  Currency,
  ProductCurrency,
  Account,
} from "../../types/account.types";
import { ReceiptPrintModal } from "../../components/ReceiptPrintModal";
import type { IReceiptData } from "../../components/ReceiptPrintModal";
import { CustomerSearchCard } from "../../components/common/CustomerSearchCard";
import { CustomerAccountSelect } from "../../components/common/CustomerAccountSelect";
import { CloseAccountModal } from "../../components/common/CloseAccountModal";

export const DemandAccountsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState(0);

  // Sekme 1: Açılış State'leri
  const [openAccountName, setOpenAccountName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sekme 2: Güncelleme State'leri
  const [selectedUpdateAccountId, setSelectedUpdateAccountId] = useState<
    number | null
  >(null);
  const [editAccountName, setEditAccountName] = useState<string>("");
  const [isSavingName, setIsSavingName] = useState<boolean>(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState<boolean>(false);

  // Sekme 3: Kapatma State'leri
  const [selectedCloseAccountId, setSelectedCloseAccountId] = useState<
    number | null
  >(null);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState<boolean>(false);
  const [accountToClose, setAccountToClose] = useState<Account | null>(null);

  // Parametrik Tanımlar
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [selectedCurrencyId, setSelectedCurrencyId] = useState<number | "">("");
  const [demandProductId, setDemandProductId] = useState<number | null>(null);

  // Müşteri Hesapları ve Yenileme Tetikleyicisi
  const [customerAccounts, setCustomerAccounts] = useState<Account[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Fiş / Dekont Yazdırma Modal State'leri
  const [openReceiptModal, setOpenReceiptModal] = useState<boolean>(false);
  const [selectedReceipt, setSelectedReceipt] = useState<IReceiptData | null>(
    null,
  );

  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // 1. URL'den customerId gelmişse müşteriyi otomatik yükle
  useEffect(() => {
    const customerIdParam = searchParams.get("customerId");
    if (customerIdParam) {
      const fetchCustomerFromUrl = async () => {
        try {
          const res = await api.get<{ success: boolean; data: Customer[] }>(
            "/customers",
          );
          const foundCustomer = (res.data.data || []).find(
            (c) => c.id === Number(customerIdParam),
          );
          if (foundCustomer) {
            setSelectedCustomer(foundCustomer);
          }
        } catch (err) {
          console.error("URL'den gelen müşteri yüklenemedi:", err);
        }
      };
      fetchCustomerFromUrl();
    }
  }, [searchParams]);

  // 2. Müşteri seçildiğinde veya yenilemede hesapları çek
  const fetchCustomerAccounts = async () => {
    if (!selectedCustomer) return;
    try {
      const res = await api.get<{ success: boolean; data: Account[] }>(
        `/accounts/customer/${selectedCustomer.id}`,
        {
          params: { accountType: "DEMAND" }, // Backend'e sadece vadesiz hesapları istediğimizi söylüyoruz
        },
      );
      // Backend zaten sadece DEMAND olanları döndüğü için doğrudan state'e atıyoruz:
      setCustomerAccounts(res.data.data || []);
    } catch (err) {
      console.error("Hesaplar yüklenemedi:", err);
    }
  };

  useEffect(() => {
    fetchCustomerAccounts();
  }, [selectedCustomer, refreshTrigger]);

  // 3. Parametreleri Çek
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

  const selectedUpdateAccount = customerAccounts.find(
    (a) => a.id === selectedUpdateAccountId,
  );
  const selectedCloseAccount = customerAccounts.find(
    (a) => a.id === selectedCloseAccountId,
  );

  useEffect(() => {
    if (selectedUpdateAccount) {
      setEditAccountName(selectedUpdateAccount.name);
    } else {
      setEditAccountName("");
    }
  }, [selectedUpdateAccountId, selectedUpdateAccount?.name]);

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
    } catch {
      alert("Fiş yüklenirken bir hata oluştu.");
    }
  };

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

      const newAccountId = createRes.data.data?.id || createRes.data.id;
      if (newAccountId) {
        handleOpenAccountReceipt(newAccountId);
      }

      setRefreshTrigger((prev) => prev + 1);
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

  const handleSaveRename = async () => {
    if (!selectedUpdateAccount || !editAccountName.trim()) return;
    try {
      setIsSavingName(true);
      await api.patch(`/accounts/${selectedUpdateAccount.id}/name`, {
        name: editAccountName.trim(),
      });
      setNotification({
        type: "success",
        message: "Hesap adı başarıyla güncellendi.",
      });
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      setNotification({
        type: "error",
        message: err.response?.data?.message || "Hesap adı güncellenemedi.",
      });
    } finally {
      setIsSavingName(false);
    }
  };

  const handleToggleBlock = async () => {
    if (!selectedUpdateAccount) return;
    const nextStatus =
      selectedUpdateAccount.status === "ACTIVE" ? "BLOCKED" : "ACTIVE";
    try {
      setIsTogglingStatus(true);
      await api.patch(`/accounts/${selectedUpdateAccount.id}/status`, {
        status: nextStatus,
      });
      setNotification({
        type: "success",
        message: `Hesap durumu başarıyla "${nextStatus === "ACTIVE" ? "Aktif" : "Bloke"}" olarak güncellendi.`,
      });
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      setNotification({
        type: "error",
        message: err.response?.data?.message || "Hesap durumu güncellenemedi.",
      });
    } finally {
      setIsTogglingStatus(false);
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
      <CustomerSearchCard
        selectedCustomer={selectedCustomer}
        onSelectCustomer={(c) => {
          setSelectedCustomer(c);
          setSelectedUpdateAccountId(null);
          setSelectedCloseAccountId(null);
        }}
      />

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

            {/* 2. SEKME: GÜNCELLEME */}
            {activeTab === 1 && (
              <Box
                sx={{
                  maxWidth: 700,
                  display: "flex",
                  flexDirection: "column",
                  gap: 3,
                }}
              >
                <Typography variant="subtitle2" color="text.secondary">
                  İşlem yapmak istediğiniz vadesiz hesabı listeden seçiniz:
                </Typography>

                <CustomerAccountSelect
                  customerId={selectedCustomer.id}
                  selectedAccountId={selectedUpdateAccountId}
                  onChange={(acc) =>
                    setSelectedUpdateAccountId(acc ? acc.id : null)
                  }
                  label="Güncellenecek Hesabı Seçiniz"
                  includeClosed={false}
                  filterOnlyActive={false}
                  refreshTrigger={refreshTrigger}
                  allowedProductTypes={["DEMAND"]}
                />

                {selectedUpdateAccount && (
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2.5,
                      borderRadius: 2.5,
                      bgcolor: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      display: "flex",
                      flexDirection: "column",
                      gap: 2.5,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 1,
                      }}
                    >
                      <Box>
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 800 }}
                        >
                          {selectedUpdateAccount.name} (
                          {selectedUpdateAccount.accountNumber})
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ fontFamily: "monospace", color: "#475569" }}
                        >
                          IBAN: {selectedUpdateAccount.iban}
                        </Typography>
                      </Box>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Chip
                          label={
                            selectedUpdateAccount.status === "ACTIVE"
                              ? "Aktif"
                              : "Bloke"
                          }
                          color={
                            selectedUpdateAccount.status === "ACTIVE"
                              ? "success"
                              : "warning"
                          }
                          size="small"
                          sx={{ fontWeight: 700 }}
                        />
                        <Tooltip title="Son İşlem Dekontunu Yazdır">
                          <Button
                            variant="outlined"
                            size="small"
                            color="secondary"
                            startIcon={<ReceiptLongIcon />}
                            onClick={() =>
                              handleOpenAccountReceipt(selectedUpdateAccount.id)
                            }
                            sx={{
                              textTransform: "none",
                              fontWeight: 600,
                              borderRadius: 1.5,
                            }}
                          >
                            Dekont
                          </Button>
                        </Tooltip>
                      </Box>
                    </Box>

                    <Divider />

                    <Box
                      sx={{
                        display: "flex",
                        gap: 1.5,
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      <TextField
                        size="small"
                        label="Hesap Adı / Tanımı"
                        value={editAccountName}
                        onChange={(e) => setEditAccountName(e.target.value)}
                        sx={{ flex: 1, minWidth: 220, bgcolor: "#fff" }}
                      />

                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={handleSaveRename}
                        disabled={
                          isSavingName ||
                          !editAccountName.trim() ||
                          editAccountName === selectedUpdateAccount.name
                        }
                        sx={{
                          textTransform: "none",
                          fontWeight: 700,
                          px: 2,
                          height: 40,
                          borderRadius: 1.5,
                        }}
                      >
                        {isSavingName ? (
                          <CircularProgress size={18} color="inherit" />
                        ) : (
                          "İsmi Kaydet"
                        )}
                      </Button>

                      <Button
                        variant="outlined"
                        size="small"
                        color={
                          selectedUpdateAccount.status === "ACTIVE"
                            ? "warning"
                            : "success"
                        }
                        startIcon={
                          selectedUpdateAccount.status === "ACTIVE" ? (
                            <BlockIcon />
                          ) : (
                            <LockOpenIcon />
                          )
                        }
                        onClick={handleToggleBlock}
                        disabled={isTogglingStatus}
                        sx={{
                          textTransform: "none",
                          fontWeight: 700,
                          px: 2,
                          height: 40,
                          borderRadius: 1.5,
                        }}
                      >
                        {isTogglingStatus ? (
                          <CircularProgress size={18} color="inherit" />
                        ) : selectedUpdateAccount.status === "ACTIVE" ? (
                          "Bloke Et"
                        ) : (
                          "Bloke Kaldır"
                        )}
                      </Button>
                    </Box>
                  </Paper>
                )}
              </Box>
            )}

            {/* 3. SEKME: HESAP DURUM & KAPATMA */}
            {activeTab === 2 && (
              <Box
                sx={{
                  maxWidth: 700,
                  display: "flex",
                  flexDirection: "column",
                  gap: 3,
                }}
              >
                <Typography variant="subtitle2" color="text.secondary">
                  Kapatma veya durum kontrolü yapmak istediğiniz hesabı listeden
                  seçiniz:
                </Typography>

                <CustomerAccountSelect
                  customerId={selectedCustomer.id}
                  selectedAccountId={selectedCloseAccountId}
                  onChange={(acc) =>
                    setSelectedCloseAccountId(acc ? acc.id : null)
                  }
                  label="Kapatılacak Hesabı Seçiniz"
                  includeClosed={true}
                  filterOnlyActive={false}
                  refreshTrigger={refreshTrigger}
                  allowedProductTypes={["DEMAND"]}
                />

                {selectedCloseAccount && (
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2.5,
                      borderRadius: 2.5,
                      bgcolor: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 1,
                      }}
                    >
                      <Box>
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 800 }}
                        >
                          [{selectedCloseAccount.accountNumber}]{" "}
                          {selectedCloseAccount.name}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ color: "#16a34a", fontWeight: 700, mt: 0.5 }}
                        >
                          Bakiye:{" "}
                          {Number(selectedCloseAccount.balance).toLocaleString(
                            "tr-TR",
                            {
                              minimumFractionDigits: 2,
                            },
                          )}{" "}
                          {selectedCloseAccount.currency?.code || "TRY"}
                        </Typography>
                      </Box>

                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                      >
                        <Chip
                          label={
                            selectedCloseAccount.status === "CLOSED"
                              ? "Kapalı"
                              : selectedCloseAccount.status === "BLOCKED"
                                ? "Bloke"
                                : "Aktif"
                          }
                          color={
                            selectedCloseAccount.status === "CLOSED"
                              ? "default"
                              : selectedCloseAccount.status === "BLOCKED"
                                ? "warning"
                                : "success"
                          }
                          size="small"
                          sx={{ fontWeight: 700 }}
                        />

                        {selectedCloseAccount.status === "CLOSED" ? (
                          <Button
                            size="small"
                            variant="outlined"
                            color="secondary"
                            startIcon={<ReceiptLongIcon />}
                            onClick={() =>
                              handleOpenAccountReceipt(selectedCloseAccount.id)
                            }
                            sx={{
                              textTransform: "none",
                              fontWeight: 700,
                              borderRadius: 1.5,
                            }}
                          >
                            Kapanış Fişini Görüntüle
                          </Button>
                        ) : (
                          <Button
                            size="small"
                            variant="contained"
                            color="error"
                            startIcon={<CancelOutlinedIcon />}
                            onClick={() => {
                              setAccountToClose(selectedCloseAccount);
                              setIsCloseModalOpen(true);
                            }}
                            sx={{
                              textTransform: "none",
                              fontWeight: 700,
                              borderRadius: 1.5,
                            }}
                          >
                            Hesabı Kapat
                          </Button>
                        )}
                      </Box>
                    </Box>
                  </Paper>
                )}
              </Box>
            )}
          </CardContent>
        </Card>
      ) : (
        <Alert severity="info">
          Lütfen işlem yapmak istediğiniz müşteriyi yukarıdaki arama alanından
          çağırınız veya Müşteri Yönetimi sayfasından bir müşteri seçiniz.
        </Alert>
      )}

      {/* YENİDEN KULLANILABİLİR HESAP KAPATMA MODALI */}
      <CloseAccountModal
        open={isCloseModalOpen}
        onClose={() => {
          setIsCloseModalOpen(false);
          setAccountToClose(null);
        }}
        account={accountToClose}
        customerId={selectedCustomer?.id || 0}
        onSuccess={() => {
          setNotification({
            type: "success",
            message: "Hesap başarıyla kapatıldı.",
          });
          setSelectedCloseAccountId(null);
          setRefreshTrigger((prev) => prev + 1);
        }}
      />

      {/* MUHASEBE FİŞİ YAZDIRMA MODALI */}
      <ReceiptPrintModal
        open={openReceiptModal}
        onClose={() => setOpenReceiptModal(false)}
        data={selectedReceipt}
      />
    </Box>
  );
};
