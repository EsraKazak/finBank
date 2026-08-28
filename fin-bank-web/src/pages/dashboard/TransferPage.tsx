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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import SwapHorizRoundedIcon from "@mui/icons-material/SwapHorizRounded";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import { ReceiptPrintModal } from "../../components/ReceiptPrintModal";
import type { IReceiptData } from "../../components/ReceiptPrintModal";
import type { Customer } from "../../types/customer.types";
import type { Account } from "../../types/account.types";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/api";

interface TransferPageProps {
  customer: Customer;
}

export const TransferPage: React.FC<TransferPageProps> = ({ customer }) => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [sourceAccountId, setSourceAccountId] = useState<number | "">("");
  const [targetAccountId, setTargetAccountId] = useState<number | "">("");
  const [loadingAccounts, setLoadingAccounts] = useState<boolean>(false);

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
      setSourceAccountId("");
      setTargetAccountId("");
      fetchAccounts();
    }
  }, [customer.id]);

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

      await fetchAccounts();
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
        <SwapHorizRoundedIcon color="primary" />
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

        <form onSubmit={handleTransfer}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* 1. HESAP SEÇİMLERİ (KAYNAK VE HEDEF) */}
            <Box
              sx={{
                display: "flex",
                gap: 2,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              {/* Kaynak Hesap Dropdown */}
              <FormControl
                fullWidth
                size="small"
                required
                sx={{ flex: 1, minWidth: 260 }}
              >
                <InputLabel id="select-source-label">
                  Kaynak Hesap (Gönderen)
                </InputLabel>
                <Select
                  labelId="select-source-label"
                  label="Kaynak Hesap (Gönderen)"
                  value={sourceAccountId}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setSourceAccountId(val);
                    if (targetAccountId === val) setTargetAccountId("");
                    setErrorMessage(null);
                  }}
                  disabled={loadingAccounts || accounts.length === 0}
                >
                  {accounts.map((acc) => (
                    <MenuItem
                      key={acc.id}
                      value={acc.id}
                      disabled={acc.status === "BLOCKED"}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          width: "100%",
                          gap: 1,
                        }}
                      >
                        <span>
                          [{acc.accountNumber}] {acc.name}{" "}
                          {acc.status === "BLOCKED" && "(BLOKE)"}
                        </span>
                        <strong
                          style={{
                            color:
                              acc.status === "BLOCKED" ? "#94a3b8" : "#16a34a",
                          }}
                        >
                          {Number(acc.balance).toLocaleString("tr-TR", {
                            minimumFractionDigits: 2,
                          })}{" "}
                          {acc.currency?.code || "TRY"}
                        </strong>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <ArrowForwardRoundedIcon
                color="action"
                sx={{ display: { xs: "none", md: "block" } }}
              />

              {/* Hedef Hesap Dropdown */}
              <FormControl
                fullWidth
                size="small"
                required
                sx={{ flex: 1, minWidth: 260 }}
              >
                <InputLabel id="select-target-label">
                  Hedef Hesap (Alıcı)
                </InputLabel>
                <Select
                  labelId="select-target-label"
                  label="Hedef Hesap (Alıcı)"
                  value={targetAccountId}
                  onChange={(e) => {
                    setTargetAccountId(Number(e.target.value));
                    setErrorMessage(null);
                  }}
                  disabled={loadingAccounts || !sourceAccountId}
                >
                  {accounts
                    .filter((acc) => acc.id !== sourceAccountId)
                    .map((acc) => (
                      <MenuItem key={acc.id} value={acc.id}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            width: "100%",
                            gap: 1,
                          }}
                        >
                          <span>
                            [{acc.accountNumber}] {acc.name}
                          </span>
                          <strong style={{ color: "#3b82f6" }}>
                            {Number(acc.balance).toLocaleString("tr-TR", {
                              minimumFractionDigits: 2,
                            })}{" "}
                            {acc.currency?.code || "TRY"}
                          </strong>
                        </Box>
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Box>

            {/* 2. KAYNAK HESAP BAKIYE KARTI */}
            {sourceAccount && targetAccount && (
              <>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: "#eff6ff",
                    border: "1px solid #bfdbfe",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 1.5,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <AccountBalanceWalletRoundedIcon
                      sx={{ color: "#1d4ed8", fontSize: 32 }}
                    />
                    <div>
                      <Typography
                        variant="caption"
                        sx={{ color: "#1e40af", fontWeight: 600 }}
                      >
                        Gönderen Hesap Kullanılabilir Bakiye
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 800, color: "#1e3a8a" }}
                      >
                        {Number(sourceAccount.balance).toLocaleString("tr-TR", {
                          minimumFractionDigits: 2,
                        })}{" "}
                        {sourceAccount.currency?.code || "TRY"}
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
                    Hedef Hesap: <strong>{targetAccount.name}</strong> (
                    {targetAccount.accountNumber})
                  </Typography>
                </Box>

                {/* 3. TUTAR VE AÇIKLAMA */}
                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
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
                              {sourceAccount?.currency?.code || "TRY"}
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

                {/* 4. ONAY BUTONU VE CHECKBOX */}
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
                    disabled={loading || !sourceAccount || !targetAccount}
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

            {(!sourceAccount || !targetAccount) && (
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                Lütfen virman işlemini gerçekleştirmek için hem{" "}
                <strong>Kaynak</strong> (gönderen) hem de <strong>Hedef</strong>{" "}
                (alıcı) hesabı seçiniz.
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
