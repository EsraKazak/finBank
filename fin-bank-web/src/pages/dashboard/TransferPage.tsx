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
  FormControlLabel,
  Checkbox,
  Grid,
} from "@mui/material";
import SwapHorizRoundedIcon from "@mui/icons-material/SwapHorizRounded";
import { ReceiptPrintModal } from "../../components/ReceiptPrintModal";
import type { IReceiptData } from "../../components/ReceiptPrintModal";
import type { Customer } from "../../types/customer.types";
import type { Account } from "../../types/account.types";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/api";
import { CustomerAccountSelect } from "../../components/common/CustomerAccountSelect";

interface TransferPageProps {
  customer: Customer;
}

export const TransferPage: React.FC<TransferPageProps> = ({ customer }) => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [sourceAccountId, setSourceAccountId] = useState<number | null>(null);
  const [targetAccountId, setTargetAccountId] = useState<number | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Form Alanları
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [autoPrintReceipt, setAutoPrintReceipt] = useState<boolean>(true);

  // Durum Yönetimi
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fiş Modal State
  const [openReceiptModal, setOpenReceiptModal] = useState<boolean>(false);
  const [receiptData, setReceiptData] = useState<IReceiptData | null>(null);

  const fetchAccounts = async () => {
    try {
      const res = await api.get<{ success: boolean; data: Account[] }>(
        `/accounts/customer/${customer.id}`,
      );
      const demandAccounts = (res.data.data || []).filter(
        (a) => a.product?.type === "DEMAND" && a.status !== "CLOSED",
      );
      setAccounts(demandAccounts);
    } catch (err) {
      console.error("Hesaplar alınamadı:", err);
    }
  };

  useEffect(() => {
    if (customer.id) {
      setSourceAccountId(null);
      setTargetAccountId(null);
      fetchAccounts();
    }
  }, [customer.id, refreshTrigger]);

  const sourceAccount = accounts.find((a) => a.id === sourceAccountId);
  const targetAccount = accounts.find((a) => a.id === targetAccountId);

  // Transfer İşlemi
  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!sourceAccount || !targetAccount) {
      setErrorMessage("Lütfen hem kaynak hesabı hem de hedef hesabı seçiniz.");
      return;
    }

    if (sourceAccount.id === targetAccount.id) {
      setErrorMessage("Kaynak hesap ile hedef hesap aynı olamaz.");
      return;
    }

    if (sourceAccount.status === "BLOCKED") {
      setErrorMessage("Kaynak hesap blokeli olduğu için transfer yapılamaz.");
      return;
    }

    if (sourceAccount.currencyId !== targetAccount.currencyId) {
      setErrorMessage(
        "Farklı para birimlerine sahip hesaplar arasında virman yapılamaz.",
      );
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMessage("Lütfen geçerli bir transfer tutarı giriniz.");
      return;
    }

    if (numAmount > Number(sourceAccount.balance)) {
      setErrorMessage(
        `Yetersiz bakiye! Kaynak hesap bakiyesi: ${Number(
          sourceAccount.balance,
        ).toLocaleString("tr-TR", {
          minimumFractionDigits: 2,
        })} ${sourceAccount.currency?.code || "TRY"}`,
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
        accountId: sourceAccount.id,
        targetAccountId: targetAccount.id,
        type: "TRANSFER",
        amount: numAmount,
        description: description
          ? `${description} - [${sourceAccount.accountNumber} -> ${targetAccount.accountNumber}]`
          : `Hesaplar Arası Virman: ${sourceAccount.accountNumber} -> ${targetAccount.accountNumber}`,
      });

      setSuccessMessage(
        `${numAmount.toLocaleString("tr-TR", {
          minimumFractionDigits: 2,
        })} ${sourceAccount.currency?.code || "TRY"} tutarındaki hesaplar arası virman başarıyla tamamlandı.`,
      );

      setAmount("");
      setDescription("");

      if (res.data?.data) {
        setReceiptData(res.data.data);
        if (autoPrintReceipt) {
          setOpenReceiptModal(true);
        }
      }

      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message ||
          "Virman işlemi sırasında bir hata meydana geldi.",
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
          Hesaplar Arası Transfer (Virman Terminali)
        </Typography>
      </Box>

      <CardContent sx={{ p: 3 }}>
        {errorMessage && (
          <Alert
            severity="error"
            sx={{ my: 2, borderRadius: 2 }}
            onClose={() => setErrorMessage(null)}
          >
            {errorMessage}
          </Alert>
        )}

        {successMessage && (
          <Alert
            severity="success"
            sx={{ my: 2, borderRadius: 2 }}
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

        <form onSubmit={handleTransfer} style={{ marginTop: 16 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            {/* 1. VE 2. ADIM: HESAP SEÇİMLERİ (YAN YANA COMBOBOX) */}
            <Grid container spacing={2}>
              {/* Kaynak Hesap */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    color: "#475569",
                    mb: 0.5,
                    display: "block",
                  }}
                >
                  Kaynak Hesap (Gönderen)
                </Typography>
                <CustomerAccountSelect
                  customerId={customer.id}
                  selectedAccountId={sourceAccountId}
                  excludeAccountId={targetAccountId} // Hedef hesapta seçili olanı kaynakta gösterme
                  onChange={(acc) => {
                    setSourceAccountId(acc ? acc.id : null);
                    if (targetAccountId === acc?.id) setTargetAccountId(null);
                    setErrorMessage(null);
                  }}
                  label="Gönderen Hesabı Seçiniz"
                  refreshTrigger={refreshTrigger}
                />
              </Grid>

              {/* Hedef Hesap */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    color: "#475569",
                    mb: 0.5,
                    display: "block",
                  }}
                >
                  Hedef Hesap (Alıcı)
                </Typography>
                <CustomerAccountSelect
                  customerId={customer.id}
                  selectedAccountId={targetAccountId}
                  excludeAccountId={sourceAccountId} // Kaynak hesapta seçili olanı hedefte gösterme
                  onChange={(acc) => {
                    setTargetAccountId(acc ? acc.id : null);
                    if (sourceAccountId === acc?.id) setSourceAccountId(null);
                    setErrorMessage(null);
                  }}
                  label="Hedef Hesabı Seçiniz"
                  disabled={!sourceAccountId}
                  refreshTrigger={refreshTrigger}
                />
              </Grid>
            </Grid>

            {/* 3. ADIM: TUTAR VE AÇIKLAMA */}
            {sourceAccount && (
              <>
                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mt: 1 }}>
                  <TextField
                    label="Transfer Tutarı"
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
                              {sourceAccount.currency?.code || "TRY"}
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
                    placeholder="Örn: Birikim hesabına virman"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    sx={{ flex: 2, minWidth: 260 }}
                  />
                </Box>

                {/* 4. ADIM: ONAY BUTONU VE CHECKBOX */}
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
                    disabled={loading || !sourceAccount || !targetAccountId}
                    startIcon={<SwapHorizRoundedIcon />}
                    sx={{
                      borderRadius: 2,
                      px: 4,
                      py: 1,
                      textTransform: "none",
                      fontWeight: 700,
                      bgcolor: "#0284c7",
                      "&:hover": { bgcolor: "#0369a1" },
                    }}
                  >
                    {loading ? (
                      <CircularProgress size={22} color="inherit" />
                    ) : (
                      "Virman İşlemini Tamamla"
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
