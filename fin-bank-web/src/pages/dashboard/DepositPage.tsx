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
import SavingsRoundedIcon from "@mui/icons-material/SavingsRounded";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import { ReceiptPrintModal } from "../../components/ReceiptPrintModal";
import type { IReceiptData } from "../../components/ReceiptPrintModal";
import type { Customer } from "../../types/customer.types";
import type { Account } from "../../types/account.types";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/api";
import { CustomerInfoCard } from "../../components/common/CustomerInfoCard";
import { CustomerAccountsGrid } from "../../components/common/CustomerAccountsGrid";

interface DepositPageProps {
  customer: Customer;
}

export const DepositPage: React.FC<DepositPageProps> = ({ customer }) => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  // Başlangıçta boş
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(
    null,
  );
  const [loadingAccounts, setLoadingAccounts] = useState<boolean>(false);

  // Form Alanları
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [depositorName, setDepositorName] = useState<string>(
    `${customer.firstName} ${customer.lastName}`,
  );
  const [depositorId, setDepositorId] = useState<string>(
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
      setSelectedAccountId(null); // Sıfırla
      fetchAccounts();
      setRefreshTrigger((prev) => prev + 1);
      setDepositorName(`${customer.firstName} ${customer.lastName}`);
      setDepositorId(customer.identityNumber);
    }
  }, [customer.id]);

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!selectedAccount) {
      setErrorMessage("Lütfen para yatırılacak vadesiz hesabı seçiniz.");
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMessage("Lütfen geçerli bir yatırma tutarı giriniz.");
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
        type: "DEPOSIT",
        amount: numAmount,
        description: description
          ? `${description} - Yatıran: ${depositorName} (TC: ${depositorId})`
          : `Gişe Nakit Para Yatırma - Yatıran: ${depositorName}`,
      });

      setSuccessMessage(
        `${numAmount.toLocaleString("tr-TR", {
          minimumFractionDigits: 2,
        })} ${selectedAccount.currency?.code || "TRY"} tutarındaki nakit tahsilat başarıyla tamamlandı.`,
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
          "Para yatırma işlemi sırasında bir hata meydana geldi.",
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
          Nakit Para Yatırma (Tahsilat) Terminali
        </Typography>
      </Box>

      <CardContent sx={{ p: 3 }}>
        <CustomerInfoCard customer={customer} />
        {errorMessage && (
          <Alert
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

        <form onSubmit={handleDeposit}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* 1. HESAP SEÇİMİ */}
            <Box>
              <CustomerAccountsGrid
                customerId={customer.id}
                selectedAccountId={selectedAccountId}
                onSelectAccount={(acc) => {
                  setSelectedAccountId(acc.id);
                  setErrorMessage(null);
                }}
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
                    bgcolor: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 1.5,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <AccountBalanceWalletRoundedIcon
                      sx={{ color: "#16a34a", fontSize: 32 }}
                    />
                    <div>
                      <Typography
                        variant="caption"
                        sx={{ color: "#15803d", fontWeight: 600 }}
                      >
                        Mevcut Hesap Bakiyesi
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 800, color: "#14532d" }}
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
                      color: "#16a34a",
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
                    label="Yatırılacak Nakit Tutar"
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
                    placeholder="Örn: Gişe nakit tahsilat"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    sx={{ flex: 2, minWidth: 260 }}
                  />
                </Box>

                {/* Parayı Yatıran Bilgileri */}
                <Divider sx={{ my: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    Parayı Yatırana Ait Bilgiler
                  </Typography>
                </Divider>

                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                  <TextField
                    label="Yatıran Kişi Ad Soyad"
                    required
                    size="small"
                    value={depositorName}
                    onChange={(e) => setDepositorName(e.target.value)}
                    sx={{ flex: 1, minWidth: 220 }}
                  />

                  <TextField
                    label="Yatıran T.C. Kimlik No"
                    required
                    size="small"
                    value={depositorId}
                    onChange={(e) =>
                      setDepositorId(
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
                    disabled={loading}
                    startIcon={<SavingsRoundedIcon />}
                    sx={{
                      borderRadius: 2,
                      px: 4,
                      py: 1,
                      textTransform: "none",
                      fontWeight: 700,
                      bgcolor: "#16a34a",
                      "&:hover": { bgcolor: "#15803d" },
                    }}
                  >
                    {loading ? (
                      <CircularProgress size={22} color="inherit" />
                    ) : (
                      "Tahsilatı Tamamla"
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
              /* HESAP SEÇİLMEDİĞİNDE */
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                İşlem tutarı ve tahsilat formunu görüntülemek için lütfen
                yukarıdan hedef vadesiz hesabı seçiniz.
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
