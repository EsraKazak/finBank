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
  IconButton,
  Tooltip,
  Dialog,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
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
import { CustomerSearchCard } from "../../components/common/CustomerSearchCard";
import { CustomerAccountsGrid } from "../../components/common/CustomerAccountsGrid";

export const DemandAccountsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState(0);

  // Form State'leri
  const [openAccountName, setOpenAccountName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Parametrik Tanımlar
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [selectedCurrencyId, setSelectedCurrencyId] = useState<number | "">("");
  const [demandProductId, setDemandProductId] = useState<number | null>(null);

  // Kapatma Modal State
  const [accountToClose, setAccountToClose] = useState<Account | null>(null);
  const [targetAccountıd, setTargetAccount] = useState<number | null>(null);
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

  // 2. Müşteri seçildiğinde veya tablo yenilendiğinde hesapları çek
  useEffect(() => {
    const fetchCustomerAccounts = async () => {
      if (!selectedCustomer) return;
      try {
        const res = await api.get<{ success: boolean; data: Account[] }>(
          `/accounts/customer/${selectedCustomer.id}`,
        );
        const demandAccounts = (res.data.data || []).filter(
          (a) => a.product?.type === "DEMAND",
        );
        setCustomerAccounts(demandAccounts);
      } catch (err) {
        console.error("Hesaplar yüklenemedi:", err);
      }
    };

    fetchCustomerAccounts();
  }, [selectedCustomer, refreshTrigger]);

  // 3. Parametreleri (Ürünler ve Para Birimleri) Çek
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
    } catch {
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

  // Durum Değiştirme (Kapatma vb.)
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

      handleOpenAccountReceipt(accountId);
      setRefreshTrigger((prev) => prev + 1);
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
      <CustomerSearchCard
        selectedCustomer={selectedCustomer}
        onSelectCustomer={(c) => setSelectedCustomer(c)}
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
              <CustomerAccountsGrid
                customerId={selectedCustomer.id}
                title="Kayıtlı Vadesiz Hesaplar ve Güncelleme"
                includeClosed={false}
                allowRename={true}
                allowStatusToggle={true}
                refreshTrigger={refreshTrigger}
                height={380}
                renderActions={(acc) => (
                  <Tooltip title="Son İşlem Fişini / Dekontu Yazdır">
                    <IconButton
                      size="small"
                      color="secondary"
                      onClick={() => handleOpenAccountReceipt(acc.id)}
                    >
                      <ReceiptLongIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              />
            )}

            {/* 3. SEKME: SADECE HESAP KAPATMA */}
            {activeTab === 2 && (
              <CustomerAccountsGrid
                customerId={selectedCustomer.id}
                title="Hesap Kapatma İşlemleri"
                includeClosed={true}
                allowRename={false}
                allowStatusToggle={false}
                refreshTrigger={refreshTrigger}
                height={380}
                renderActions={(acc) => (
                  <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                    {acc.status === "CLOSED" ? (
                      <Tooltip title="Kapanış Fişini Görüntüle">
                        <IconButton
                          size="small"
                          color="secondary"
                          onClick={() => handleOpenAccountReceipt(acc.id)}
                        >
                          <ReceiptLongIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<CancelOutlinedIcon />}
                        onClick={() => {
                          setAccountToClose(acc);
                          setTargetAccount(null);
                        }}
                        sx={{
                          textTransform: "none",
                          borderRadius: 1.5,
                          fontSize: 11,
                        }}
                      >
                        Hesabı Kapat
                      </Button>
                    )}
                  </Box>
                )}
              />
            )}
          </CardContent>
        </Card>
      ) : (
        <Alert severity="info">
          Lütfen işlem yapmak istediğiniz müşteriyi yukarıdaki arama alanından
          çağırınız veya Müşteri Yönetimi sayfasından bir müşteri seçiniz.
        </Alert>
      )}

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

          {/* BAKİYE > 0 İSE HEDEF HESAP SEÇİM KUTUSU */}
          {accountToClose && Number(accountToClose.balance || 0) > 0 && (
            <Box sx={{ width: "100%", mt: 2, textAlign: "left" }}>
              <Alert severity="warning" sx={{ mb: 2, fontSize: 13 }}>
                Kapatılacak hesapta{" "}
                <strong>
                  {Number(accountToClose.balance).toLocaleString("tr-TR", {
                    minimumFractionDigits: 2,
                  })}{" "}
                  {accountToClose.currency?.code || "TRY"}
                </strong>{" "}
                bakiye bulunmaktadır. Kapatma işlemi için bu tutarın
                aktarılacağı hedef hesabı seçmelisiniz.
              </Alert>

              {(() => {
                const availableTargets = customerAccounts.filter(
                  (acc) =>
                    acc.id !== accountToClose.id &&
                    acc.status === "ACTIVE" &&
                    acc.currencyId === accountToClose.currencyId,
                );

                if (availableTargets.length === 0) {
                  return (
                    <Alert severity="error" sx={{ fontSize: 12 }}>
                      Müşteriye ait aynı para biriminde (
                      {accountToClose.currency?.code}) başka aktif hesap
                      bulunamadı. Lütfen önce bakiyeyi gişeden nakit çekiniz
                      veya yeni bir hesap açınız.
                    </Alert>
                  );
                }

                return (
                  <FormControl fullWidth size="small" required sx={{ mt: 1 }}>
                    <InputLabel>Aktarılacak Hedef Hesap</InputLabel>
                    <Select
                      value={targetAccountıd ?? ""}
                      label="Aktarılacak Hedef Hesap"
                      onChange={(e) => setTargetAccount(Number(e.target.value))}
                    >
                      {availableTargets.map((acc) => (
                        <MenuItem key={acc.id} value={acc.id}>
                          [{acc.accountNumber}] {acc.name} — Bakiye:{" "}
                          {Number(acc.balance).toLocaleString("tr-TR", {
                            minimumFractionDigits: 2,
                          })}{" "}
                          {acc.currency?.code}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                );
              })()}
            </Box>
          )}
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
              if (!accountToClose || !selectedCustomer) return;
              const currentBalance = Number(accountToClose.balance || 0);

              try {
                setIsSubmitting(true);

                // 1. Bakiye varsa önce virman yap
                if (currentBalance > 0 && targetAccountıd) {
                  await api.post("/accounting", {
                    branchId: Number(selectedCustomer.branchId || 1),
                    accountId: accountToClose.id,
                    targetAccountId: targetAccountıd,
                    type: "TRANSFER",
                    amount: currentBalance,
                    description: `Hesap Kapatma Bakiye Aktarımı: [${accountToClose.accountNumber}] -> [${targetAccountıd}]`,
                  });
                }

                // 2. Hesabı kapat
                const accId = accountToClose.id;
                setAccountToClose(null);
                setTargetAccount(null);
                await handleUpdateStatus(accId, "CLOSED");
              } catch (err: any) {
                alert(
                  err.response?.data?.message || "Hesap kapatma başarısız.",
                );
              } finally {
                setIsSubmitting(false);
              }
            }}
            variant="contained"
            color="error"
            disabled={
              isSubmitting ||
              (accountToClose !== null &&
                Number(accountToClose.balance || 0) > 0 &&
                !targetAccountıd)
            }
            sx={{ borderRadius: 2, textTransform: "none", px: 3 }}
          >
            {isSubmitting ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Evet, Aktar ve Hesabı Kapat"
            )}
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
