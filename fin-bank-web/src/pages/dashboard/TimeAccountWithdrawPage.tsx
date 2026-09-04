import React, { useState, useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  Alert,
  FormControlLabel,
  Checkbox,
  InputAdornment,
  CircularProgress,
  Divider,
  RadioGroup,
  Radio,
  FormControl,
  FormLabel,
} from "@mui/material";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";

import { CustomerSearchCard } from "../../components/common/CustomerSearchCard";
import { CustomerInfoCard } from "../../components/common/CustomerInfoCard";
import { CustomerAccountSelect } from "../../components/common/CustomerAccountSelect";
import { ReceiptPrintModal } from "../../components/ReceiptPrintModal";
import { useReceiptModal } from "../../hooks/useReceiptModal";
import { withdrawFromTimeAccount } from "../../services/api";
import type { Account } from "../../types/account.types";

const MIN_REQUIRED_BALANCE = 1000;

export const TimeAccountWithdrawPage: React.FC = () => {
  const [customer, setCustomer] = useState<any>(null);
  const [timeAccount, setTimeAccount] = useState<Account | null>(null);

  // Çekim Hedefi State'leri
  const [targetType, setTargetType] = useState<"DEMAND" | "CASH">("DEMAND");
  const [demandAccount, setDemandAccount] = useState<Account | null>(null);

  const [amount, setAmount] = useState<string>("");
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const receipt = useReceiptModal();

  const maxWithdrawable = useMemo(() => {
    if (!timeAccount) return 0;
    const currentBalance = Number(timeAccount.balance);
    return Math.max(0, currentBalance - MIN_REQUIRED_BALANCE);
  }, [timeAccount]);

  const parsedAmount = parseFloat(amount) || 0;

  const isTargetValid = () => {
    if (!timeAccount) return false;
    if (targetType === "DEMAND") return demandAccount !== null;
    if (targetType === "CASH") return true;
    return false;
  };

  const isAmountValid =
    parsedAmount > 0 && parsedAmount <= maxWithdrawable && isTargetValid();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!timeAccount) {
      setErrorMessage("Lütfen kaynak vadeli hesabı seçiniz.");
      return;
    }

    if (!isTargetValid()) {
      setErrorMessage("Lütfen aktarılacak hedef vadesiz hesabı seçiniz.");
      return;
    }

    if (parsedAmount <= 0) {
      setErrorMessage("Lütfen geçerli bir tutar giriniz.");
      return;
    }

    if (parsedAmount > maxWithdrawable) {
      setErrorMessage(
        `Vadeli hesapta en az ${MIN_REQUIRED_BALANCE} ${timeAccount.currency?.code} kalmalıdır. Çekilebilecek azami tutar: ${maxWithdrawable.toFixed(2)} ${timeAccount.currency?.code}`,
      );
      return;
    }

    try {
      setSubmitting(true);
      const res = await withdrawFromTimeAccount({
        timeAccountId: timeAccount.id,
        targetType,
        demandAccountId:
          targetType === "DEMAND" ? demandAccount?.id : undefined,
        amount: parsedAmount,
      });

      if (res.success) {
        setSuccessMessage(res.message || "İşlem başarıyla gerçekleştirildi.");

        if (res.data) {
          receipt.triggerReceipt({
            receiptNumber: res.data.receiptNumber,
            transactionDate: new Date().toISOString(),
            type:
              targetType === "CASH"
                ? "VADELİDEN KASAYA NAKİT ÇEKİM"
                : "VADELİDEN VADESİZE VİRMAN",
            amount: res.data.amount,
            description:
              targetType === "CASH"
                ? `Vadeli [${res.data.timeAccountNumber}] nolu hesaptan kasaya elden nakit ödeme yapıldı. Kalan Vadeli Bakiye: ${res.data.remainingTimeBalance} ${res.data.currency}`
                : `[${res.data.timeAccountNumber}] nolu vadeli hesaptan [${res.data.demandAccountNumber}] nolu vadesiz hesaba aktarıldı. Kalan Vadeli Bakiye: ${res.data.remainingTimeBalance} ${res.data.currency}`,
            // 1. EKSİK OLAN VE ÇÖKMEYE SEBEP OLAN ŞUBE BİLGİSİ:
            branch: {
              code: customer?.branch?.code || "101",
              name: customer?.branch?.name || "Merkez",
              city: customer?.branch?.city || "İstanbul",
            },

            account: {
              accountNumber: res.data.timeAccountNumber,
              iban: timeAccount?.iban || "-",
              name: `${customer?.firstName || ""} ${customer?.lastName || ""}`.trim(),
              currency: {
                code: res.data.currency || timeAccount?.currency?.code || "TRY",
              },
            },
          });
        }

        setAmount("");
        setTimeAccount(null);
        setDemandAccount(null);
        setRefreshTrigger((prev) => prev + 1);
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message ||
          "Para çekme işlemi sırasında bir hata oluştu.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        Vadeli Hesaptan Para Çekme
      </Typography>

      <CustomerSearchCard
        selectedCustomer={customer}
        onSelectCustomer={(cust: any) => {
          setCustomer(cust);
          setTimeAccount(null);
          setDemandAccount(null);
          setAmount("");
        }}
      />

      {customer && <CustomerInfoCard customer={customer} />}

      {customer && (
        <Card elevation={2}>
          <CardContent sx={{ p: 3 }}>
            <Box component="form" onSubmit={handleSubmit}>
              {errorMessage && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {errorMessage}
                </Alert>
              )}
              {successMessage && (
                <Alert severity="success" sx={{ mb: 3 }}>
                  {successMessage}
                </Alert>
              )}

              <Grid container spacing={3}>
                {/* 1. Kaynak Vadeli Hesap */}
                <Grid size={{ xs: 12 }}>
                  <CustomerAccountSelect
                    customerId={customer.id}
                    value={timeAccount}
                    label="Kaynak Vadeli Hesap Seçiniz"
                    allowedProductTypes={["TIME"]}
                    refreshTrigger={refreshTrigger}
                    disabled={submitting}
                    onChange={(acc) => {
                      setTimeAccount(acc);
                      setDemandAccount(null);
                    }}
                  />

                  {timeAccount && (
                    <Box
                      sx={{
                        mt: 2,
                        p: 2,
                        bgcolor: "#f4f6f8",
                        borderRadius: 1.5,
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        Mevcut Bakiye:{" "}
                        <b>
                          {Number(timeAccount.balance).toFixed(2)}{" "}
                          {timeAccount.currency?.code}
                        </b>
                      </Typography>
                      <Typography
                        variant="body2"
                        color="primary.main"
                        sx={{ mt: 0.5 }}
                      >
                        Çekilebilir Azami Tutar:{" "}
                        <b>
                          {maxWithdrawable.toFixed(2)}{" "}
                          {timeAccount.currency?.code}
                        </b>
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", mt: 0.5 }}
                      >
                        * Kural gereği hesapta en az {MIN_REQUIRED_BALANCE}{" "}
                        {timeAccount.currency?.code} bakiye kalmalıdır.
                      </Typography>
                    </Box>
                  )}
                </Grid>

                {/* 2. Çekim Hedefi Seçimi (Radio Group) */}
                <Grid size={{ xs: 12 }}>
                  <FormControl
                    component="fieldset"
                    disabled={!timeAccount || submitting}
                  >
                    <FormLabel
                      component="legend"
                      sx={{ fontSize: "0.88rem", fontWeight: 700, mb: 0.5 }}
                    >
                      Paranın Çekileceği Yer
                    </FormLabel>
                    <RadioGroup
                      row
                      value={targetType}
                      onChange={(e) => {
                        setTargetType(e.target.value as any);
                        setDemandAccount(null);
                      }}
                    >
                      <FormControlLabel
                        value="DEMAND"
                        control={<Radio size="small" />}
                        label="Vadesiz Hesaba Aktar"
                      />
                      <FormControlLabel
                        value="CASH"
                        control={<Radio size="small" />}
                        label="Kasadan Çek (Elden Nakit Teslim)"
                      />
                    </RadioGroup>
                  </FormControl>
                </Grid>

                {/* 3. Hedef Vadesiz Hesap (Yalnızca DEMAND seçiliyse açılır) */}
                {targetType === "DEMAND" && timeAccount && (
                  <Grid size={{ xs: 12, md: 6 }}>
                    <CustomerAccountSelect
                      customerId={customer.id}
                      value={demandAccount}
                      label="Aktarılacak Vadesiz Hesap Seçiniz"
                      allowedProductTypes={["DEMAND"]}
                      currencyId={timeAccount.currencyId}
                      refreshTrigger={refreshTrigger}
                      disabled={submitting}
                      onChange={(acc) => setDemandAccount(acc)}
                    />
                  </Grid>
                )}

                {targetType === "CASH" && timeAccount && (
                  <Grid size={{ xs: 12 }}>
                    <Alert severity="info">
                      Tutar vadeli hesaptan düşülecek ve şube gişe kasasından
                      müşteriye elden nakit olarak ödenecektir.
                    </Alert>
                  </Grid>
                )}

                <Grid size={{ xs: 12 }}>
                  <Divider />
                </Grid>

                {/* 4. Çekilecek Tutar */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Çekilmek İstenen Tutar"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={!isTargetValid() || submitting}
                    error={parsedAmount > maxWithdrawable}
                    helperText={
                      parsedAmount > maxWithdrawable
                        ? `Azami çekilebilir limit aşıldı (${maxWithdrawable.toFixed(2)} ${timeAccount?.currency?.code})`
                        : ""
                    }
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            {timeAccount?.currency?.code || "TL"}
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </Grid>

                {/* Fiş Yazdırma Checkbox */}
                <Grid
                  size={{ xs: 12, md: 6 }}
                  sx={{ display: "flex", alignItems: "center" }}
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={receipt.printReceipt}
                        onChange={(e) =>
                          receipt.setPrintReceipt(e.target.checked)
                        }
                        color="primary"
                      />
                    }
                    label="İşlem sonrası dekont / fiş yazdır"
                  />
                </Grid>

                {/* Gönder Butonu */}
                <Grid size={{ xs: 12 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    size="large"
                    disabled={!isAmountValid || submitting}
                    startIcon={
                      submitting ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        <AccountBalanceWalletIcon />
                      )
                    }
                  >
                    {submitting
                      ? "İşlem Yapılıyor..."
                      : targetType === "CASH"
                        ? "Kasadan Nakit Çek"
                        : "Parayı Vadesiz Hesaba Aktar"}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </CardContent>
        </Card>
      )}

      {receipt.data && (
        <ReceiptPrintModal
          open={receipt.isOpen}
          onClose={receipt.closeReceipt}
          data={receipt.data}
        />
      )}
    </Box>
  );
};

export default TimeAccountWithdrawPage;
