import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  InputAdornment,
  CircularProgress,
  Alert,
  Divider,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import PaidRoundedIcon from "@mui/icons-material/PaidRounded";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import { ReceiptPrintModal } from "../../components/ReceiptPrintModal";
import type { IReceiptData } from "../../components/ReceiptPrintModal";
import type { Customer } from "../../types/customer.types";
import type { Account } from "../../types/account.types";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/api";
import { CustomerAccountSelect } from "../../components/common/CustomerAccountSelect";

interface WithdrawalPageProps {
  customer: Customer;
}

export const WithdrawalPage: React.FC<WithdrawalPageProps> = ({ customer }) => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  // Başlangıçta boş; kullanıcı manuel seçecek
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(
    null,
  );
  const [loadingAccounts, setLoadingAccounts] = useState<boolean>(false);

  // Form Alanları
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [withdrawerName, setWithdrawerName] = useState<string>(
    `${customer.firstName} ${customer.lastName}`,
  );
  const [withdrawerId, setWithdrawerId] = useState<string>(
    customer.identityNumber,
  );
  const [autoPrintReceipt, setAutoPrintReceipt] = useState<boolean>(true);

  // Durum Yönetimi
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fiş Modal State
  const [openReceiptModal, setOpenReceiptModal] = useState<boolean>(false);
  const [receiptData, setReceiptData] = useState<IReceiptData | null>(null);

  //gridi set etmek için
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const fetchAccounts = async () => {
    try {
      setLoadingAccounts(true);
      const res = await api.get<{ success: boolean; data: Account[] }>(
        `/accounts/customer/${customer.id}`,
      );
      const demandAccounts = (res.data.data || []).filter(
        (a) => a.product?.type === "DEMAND" && a.status !== "CLOSED",
      );
      setAccounts(demandAccounts);
    } catch (err) {
      console.error("Hesaplar alınamadı:", err);
    } finally {
      setLoadingAccounts(false);
    }
  };

  useEffect(() => {
    if (customer.id) {
      setSelectedAccountId(null); // Müşteri değiştiğinde veya sayfa ilk açıldığında seçimi sıfırla
      fetchAccounts();
      setRefreshTrigger((prev) => prev + 1);
      setWithdrawerName(`${customer.firstName} ${customer.lastName}`);
      setWithdrawerId(customer.identityNumber);
    }
  }, [customer.id]);

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!selectedAccount) {
      setErrorMessage("Lütfen işlem yapılacak vadesiz hesabı seçiniz.");
      return;
    }

    if (selectedAccount.status === "BLOCKED") {
      setErrorMessage(
        "Bu hesap blokeli olduğu için para çekme işlemi yapılamaz.",
      );
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMessage("Lütfen geçerli bir çekim tutarı giriniz.");
      return;
    }

    if (numAmount > Number(selectedAccount.balance)) {
      setErrorMessage(
        `Yetersiz bakiye! Mevcut bakiye: ${Number(
          selectedAccount.balance,
        ).toLocaleString("tr-TR", {
          minimumFractionDigits: 2,
        })} ${selectedAccount.currency?.code || "TRY"}`,
      );
      return;
    }

    const branchId = (user as any)?.branchId || customer.branchId;
    if (!branchId) {
      setErrorMessage("Kullanıcıya ait şube bilgisi doğrulanamadı.");
      return;
    }

    try {
      setLoading(true);

      const res = await api.post("/accounting", {
        branchId: Number(branchId),
        accountId: selectedAccount.id,
        type: "WITHDRAWAL",
        amount: numAmount,
        description: description
          ? `${description} - Alan: ${withdrawerName} (TC: ${withdrawerId})`
          : `Gişe Nakit Para Çekme - Alan: ${withdrawerName}`,
      });

      setSuccessMessage(
        `${numAmount.toLocaleString("tr-TR", {
          minimumFractionDigits: 2,
        })} ${selectedAccount.currency?.code || "TRY"} tutarındaki para çekme işlemi başarıyla tamamlandı.`,
      );

      setAmount("");
      setDescription("");

      if (res.data?.data) {
        setReceiptData(res.data.data);
        if (autoPrintReceipt) {
          setOpenReceiptModal(true);
        }
      }

      await fetchAccounts();
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message ||
          "Para çekme işlemi sırasında bir hata meydana geldi.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      sx={{
        borderRadius: 3,
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        border: "1px solid #e2e8f0",
      }}
    >
      <Box
        sx={{
          p: 2,
          bgcolor: "#f8fafc",
          borderBottom: "1px solid #e2e8f0",
          display: "flex",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 800, color: "#0f172a" }}
        >
          Nakit Para Çekme (Ödeme) Terminali
        </Typography>
      </Box>

      <CardContent sx={{ p: 3 }}>
        {errorMessage && (
          <Alert
            icon={<WarningAmberRoundedIcon fontSize="inherit" />}
            severity="error"
            sx={{ mb: 3, borderRadius: 2 }}
            onClose={() => setErrorMessage(null)}
          >
            {errorMessage}
          </Alert>
        )}

        {successMessage && (
          <Alert
            severity="success"
            sx={{ mb: 3, borderRadius: 2 }}
            onClose={() => setSuccessMessage(null)}
            action={
              receiptData ? (
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => setOpenReceiptModal(true)}
                  sx={{ fontWeight: 700, textTransform: "none" }}
                >
                  Fişi Aç
                </Button>
              ) : undefined
            }
          >
            {successMessage}
          </Alert>
        )}

        <form onSubmit={handleWithdraw}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* 1. HESAP SEÇİMİ */}
            <Box>
              <CustomerAccountSelect
                customerId={customer.id}
                selectedAccountId={selectedAccountId}
                onChange={(acc) => {
                  setSelectedAccountId(acc ? acc.id : null);
                  setErrorMessage(null);
                }}
                label="Para Çekilecek Hesabı Seçiniz"
                filterOnlyActive={true}
                refreshTrigger={refreshTrigger}
              />

              {accounts.length === 0 && !loadingAccounts && (
                <Typography
                  variant="caption"
                  color="error"
                  sx={{ mt: 0.5, display: "block" }}
                >
                  Müşteriye ait aktif vadesiz hesap bulunamadı.
                </Typography>
              )}
            </Box>

            {/* HESAP SEÇİLDİĞİNDE AÇILAN ALANLAR */}
            {selectedAccount ? (
              <>
                {/* Seçili Hesap Bakiye Kartı */}
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor:
                      selectedAccount.status === "BLOCKED"
                        ? "#fffbeb"
                        : "#eff6ff",
                    border: `1px solid ${selectedAccount.status === "BLOCKED" ? "#fef3c7" : "#bfdbfe"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 1.5,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <AccountBalanceWalletRoundedIcon
                      sx={{
                        color:
                          selectedAccount.status === "BLOCKED"
                            ? "#d97706"
                            : "#1d4ed8",
                        fontSize: 32,
                      }}
                    />
                    <div>
                      <Typography
                        variant="caption"
                        sx={{ color: "#1e40af", fontWeight: 600 }}
                      >
                        Kullanılabilir Hesap Bakiyesi{" "}
                        {selectedAccount.status === "BLOCKED" &&
                          "(Hesap Blokeli)"}
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 800,
                          color:
                            selectedAccount.status === "BLOCKED"
                              ? "#b45309"
                              : "#1e3a8a",
                        }}
                      >
                        {Number(selectedAccount.balance).toLocaleString(
                          "tr-TR",
                          {
                            minimumFractionDigits: 2,
                          },
                        )}{" "}
                        {selectedAccount.currency?.code || "TRY"}
                      </Typography>
                    </div>
                  </Box>

                  <Typography
                    variant="body2"
                    sx={{
                      color: "#3b82f6",
                      fontFamily: "monospace",
                      fontSize: 13,
                    }}
                  >
                    IBAN: {selectedAccount.iban}
                  </Typography>
                </Box>

                {/* Tutar ve Açıklama */}
                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                  <TextField
                    label="Çekilecek Tutar"
                    type="number"
                    required
                    fullWidth
                    size="small"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <strong>
                              {selectedAccount?.currency?.code || "TRY"}
                            </strong>
                          </InputAdornment>
                        ),
                      },
                    }}
                    sx={{ flex: 1, minWidth: 220 }}
                  />

                  <TextField
                    label="İşlem Açıklaması"
                    fullWidth
                    size="small"
                    placeholder="Örn: Gişe nakit ödeme"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    sx={{ flex: 2, minWidth: 260 }}
                  />
                </Box>

                {/* Teslim Alan Bilgileri */}
                <Divider sx={{ my: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    Parayı Teslim Alan Kişi (Müşteri veya Yasal Vekil)
                  </Typography>
                </Divider>

                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                  <TextField
                    label="Teslim Alan Ad Soyad"
                    required
                    size="small"
                    value={withdrawerName}
                    onChange={(e) => setWithdrawerName(e.target.value)}
                    sx={{ flex: 1, minWidth: 220 }}
                  />

                  <TextField
                    label="Teslim Alan T.C. Kimlik No"
                    required
                    size="small"
                    value={withdrawerId}
                    onChange={(e) =>
                      setWithdrawerId(
                        e.target.value.replace(/\D/g, "").slice(0, 11),
                      )
                    }
                    sx={{ flex: 1, minWidth: 220 }}
                  />
                </Box>

                {/* Buton ve Checkbox */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 2,
                    pt: 1,
                  }}
                >
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading || selectedAccount.status === "BLOCKED"}
                    startIcon={<PaidRoundedIcon />}
                    sx={{
                      borderRadius: 2,
                      px: 4,
                      py: 1,
                      textTransform: "none",
                      fontWeight: 700,
                      bgcolor: "#0a192f",
                      "&:hover": { bgcolor: "#1e293b" },
                    }}
                  >
                    {loading ? (
                      <CircularProgress size={22} color="inherit" />
                    ) : (
                      "Ödemeyi Tamamla"
                    )}
                  </Button>

                  <FormControlLabel
                    control={
                      <Checkbox
                        size="small"
                        checked={autoPrintReceipt}
                        onChange={(e) => setAutoPrintReceipt(e.target.checked)}
                      />
                    }
                    label={
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: 13,
                          color: "text.secondary",
                          fontWeight: 500,
                        }}
                      >
                        İşlem sonrası fişi/dekontu otomatik aç
                      </Typography>
                    }
                  />
                </Box>
              </>
            ) : (
              /* HESAP HENÜZ SEÇİLMEDİĞİNDE ÇIKAN BİLGİLENDİRME KUTUSU */
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                İşlem tutarı ve ödeme formunu görüntülemek için lütfen yukarıdan
                işlem yapmak istediğiniz vadesiz hesabı seçiniz.
              </Alert>
            )}
          </Box>
        </form>
      </CardContent>

      <ReceiptPrintModal
        open={openReceiptModal}
        onClose={() => setOpenReceiptModal(false)}
        data={receiptData}
      />
    </Card>
  );
};
