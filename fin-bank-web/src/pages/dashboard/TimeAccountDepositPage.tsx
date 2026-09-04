import React, { useState } from "react";
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
import { depositToTimeAccount } from "../../services/api";
import type { Account } from "../../types/account.types";

const MIN_SOURCE_TIME_BALANCE = 1000;

export const TimeAccountDepositPage: React.FC = () => {
  const [customer, setCustomer] = useState<any>(null);

  const [targetAccount, setTargetAccount] = useState<Account | null>(null);
  const [sourceType, setSourceType] = useState<"DEMAND" | "TIME" | "CASH">(
    "DEMAND",
  );
  const [sourceDemandAccount, setSourceDemandAccount] =
    useState<Account | null>(null);
  const [sourceTimeAccount, setSourceTimeAccount] = useState<Account | null>(
    null,
  );

  const [amount, setAmount] = useState<string>("");
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Ortak Dekont Hook'u
  const receipt = useReceiptModal();

  const parsedAmount = parseFloat(amount) || 0;

  const isSourceValid = () => {
    if (!targetAccount) return false;
    if (sourceType === "DEMAND") return sourceDemandAccount !== null;
    if (sourceType === "TIME") return sourceTimeAccount !== null;
    if (sourceType === "CASH") return true;
    return false;
  };

  const getSourceMaxLimit = () => {
    if (sourceType === "DEMAND" && sourceDemandAccount) {
      return Number(sourceDemandAccount.balance);
    }
    if (sourceType === "TIME" && sourceTimeAccount) {
      return Math.max(
        0,
        Number(sourceTimeAccount.balance) - MIN_SOURCE_TIME_BALANCE,
      );
    }
    return Infinity;
  };

  const maxLimit = getSourceMaxLimit();
  const isAmountValid =
    parsedAmount > 0 && parsedAmount <= maxLimit && isSourceValid();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!targetAccount) {
      setErrorMessage("Lütfen para yatırılacak hedef vadeli hesabı seçiniz.");
      return;
    }

    if (!isSourceValid()) {
      setErrorMessage("Lütfen geçerli bir kaynak belirleyiniz.");
      return;
    }

    if (parsedAmount <= 0) {
      setErrorMessage("Yatırılacak tutar 0'dan büyük olmalıdır.");
      return;
    }

    if (parsedAmount > maxLimit) {
      setErrorMessage(
        sourceType === "TIME"
          ? `Kaynak vadeli hesapta en az ${MIN_SOURCE_TIME_BALANCE} ${sourceTimeAccount?.currency?.code} kalmalıdır. Çekilebilecek azami tutar: ${maxLimit.toFixed(2)} ${sourceTimeAccount?.currency?.code}`
          : `Kaynak hesapta yetersiz bakiye. Mevcut bakiye: ${maxLimit.toFixed(2)}`,
      );
      return;
    }

    try {
      setSubmitting(true);
      const selectedSourceId =
        sourceType === "DEMAND"
          ? sourceDemandAccount?.id
          : sourceType === "TIME"
            ? sourceTimeAccount?.id
            : undefined;

      const res = await depositToTimeAccount({
        targetAccountId: targetAccount.id,
        sourceType,
        sourceAccountId: selectedSourceId,
        amount: parsedAmount,
      });

      if (res.success) {
        setSuccessMessage(
          res.message || "Para yatırma işlemi başarıyla tamamlandı.",
        );

        if (res.data) {
          receipt.triggerReceipt({
            receiptNumber: res.data.receiptNumber,
            transactionDate: new Date().toISOString(),
            type: `VADELİYE PARA YATIRMA (${
              sourceType === "CASH"
                ? "NAKİT TAHSİLAT"
                : sourceType === "DEMAND"
                  ? "VADESİZDEN VİRMAN"
                  : "VADELİDEN VİRMAN"
            })`,
            amount: res.data.amount,
            description: `Hedef Vadeli: [${res.data.targetAccountNumber}] | Yeni Bakiye: ${res.data.newBalance} ${res.data.currency} | Faiz: %${res.data.oldInterestRate} -> %${res.data.newInterestRate}`,
            branch: {
              code: customer?.branch?.code || "101",
              name: customer?.branch?.name || "Merkez",
              city: customer?.branch?.city || "İstanbul",
            },
            account: {
              accountNumber: res.data.targetAccountNumber,
              iban: targetAccount?.iban || "-",
              name: `${customer?.firstName || ""} ${customer?.lastName || ""}`.trim(),
              currency: {
                code:
                  res.data.currency || targetAccount?.currency?.code || "TRY",
              },
            },
          });
        }

        setAmount("");
        setSourceDemandAccount(null);
        setSourceTimeAccount(null);
        setTargetAccount(null);
        setRefreshTrigger((prev) => prev + 1);
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message ||
          "Para yatırma işlemi sırasında bir hata oluştu.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        Vadeli Hesaba Para Yatırma
      </Typography>

      <CustomerSearchCard
        selectedCustomer={customer}
        onSelectCustomer={(cust: any) => {
          setCustomer(cust);
          setTargetAccount(null);
          setSourceDemandAccount(null);
          setSourceTimeAccount(null);
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
                <Grid size={{ xs: 12 }}>
                  <CustomerAccountSelect
                    customerId={customer.id}
                    value={targetAccount}
                    label="Para Yatırılacak Vadeli Hesabı Seçiniz"
                    allowedProductTypes={["TIME"]}
                    refreshTrigger={refreshTrigger}
                    disabled={submitting}
                    onChange={(acc) => {
                      setTargetAccount(acc);
                      setSourceDemandAccount(null);
                      setSourceTimeAccount(null);
                    }}
                  />

                  {targetAccount && (
                    <Box
                      sx={{
                        mt: 1.5,
                        p: 2,
                        bgcolor: "#f8fafc",
                        borderRadius: 1.5,
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        Mevcut Bakiye:{" "}
                        <b>
                          {Number(targetAccount.balance).toFixed(2)}{" "}
                          {targetAccount.currency?.code}
                        </b>{" "}
                        | Mevcut Faiz Oranı:{" "}
                        <b>%{targetAccount.interestRate || 0}</b>
                      </Typography>
                      <Typography
                        variant="caption"
                        color="primary.main"
                        sx={{ display: "block", mt: 0.5 }}
                      >
                        * Yatırılan tutara göre faiz oranı otomatik
                        güncellenecektir.
                      </Typography>
                    </Box>
                  )}
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <FormControl
                    component="fieldset"
                    disabled={!targetAccount || submitting}
                  >
                    <FormLabel
                      component="legend"
                      sx={{ fontSize: "0.88rem", fontWeight: 700, mb: 0.5 }}
                    >
                      Paranın Kaynağı
                    </FormLabel>
                    <RadioGroup
                      row
                      value={sourceType}
                      onChange={(e) => {
                        setSourceType(e.target.value as any);
                        setSourceDemandAccount(null);
                        setSourceTimeAccount(null);
                      }}
                    >
                      <FormControlLabel
                        value="DEMAND"
                        control={<Radio size="small" />}
                        label="Vadesiz Hesaptan"
                      />
                      <FormControlLabel
                        value="TIME"
                        control={<Radio size="small" />}
                        label="Başka Vadeli Hesaptan"
                      />
                      <FormControlLabel
                        value="CASH"
                        control={<Radio size="small" />}
                        label="Kasadan (Elden Nakit)"
                      />
                    </RadioGroup>
                  </FormControl>
                </Grid>

                {sourceType === "DEMAND" && targetAccount && (
                  <Grid size={{ xs: 12, md: 6 }}>
                    <CustomerAccountSelect
                      customerId={customer.id}
                      value={sourceDemandAccount}
                      label="Kaynak Vadesiz Hesap Seçiniz"
                      allowedProductTypes={["DEMAND"]}
                      currencyId={targetAccount.currencyId}
                      refreshTrigger={refreshTrigger}
                      disabled={submitting}
                      onChange={(acc) => setSourceDemandAccount(acc)}
                    />
                  </Grid>
                )}

                {sourceType === "TIME" && targetAccount && (
                  <Grid size={{ xs: 12, md: 6 }}>
                    <CustomerAccountSelect
                      customerId={customer.id}
                      value={sourceTimeAccount}
                      label="Kaynak Vadeli Hesap Seçiniz"
                      allowedProductTypes={["TIME"]}
                      excludeAccountId={targetAccount.id}
                      currencyId={targetAccount.currencyId}
                      refreshTrigger={refreshTrigger}
                      disabled={submitting}
                      onChange={(acc) => setSourceTimeAccount(acc)}
                    />
                    {sourceTimeAccount && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", mt: 1 }}
                      >
                        * Bu hesapta en az {MIN_SOURCE_TIME_BALANCE}{" "}
                        {sourceTimeAccount.currency?.code} bakiye kalmalıdır.
                      </Typography>
                    )}
                  </Grid>
                )}

                {sourceType === "CASH" && targetAccount && (
                  <Grid size={{ xs: 12 }}>
                    <Alert severity="info">
                      Müşteriden fiziken elden nakit tahsil edilerek şube gişe
                      kasasına işlenecektir.
                    </Alert>
                  </Grid>
                )}

                <Grid size={{ xs: 12 }}>
                  <Divider />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Yatırılacak Tutar"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={!isSourceValid() || submitting}
                    error={parsedAmount > maxLimit}
                    helperText={
                      parsedAmount > maxLimit
                        ? `Kaynak hesap limiti aşıldı (Azami: ${maxLimit.toFixed(2)})`
                        : ""
                    }
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            {targetAccount?.currency?.code || "TL"}
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </Grid>

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
                    {submitting ? "İşlem Yapılıyor..." : "Vadeli Hesaba Yatır"}
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

export default TimeAccountDepositPage;
