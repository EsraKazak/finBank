import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Divider,
} from "@mui/material";
import EditCalendarIcon from "@mui/icons-material/EditCalendar";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import api from "../../services/api";
import type { Customer } from "../../types/customer.types";
import type { RenewalType } from "../../types/account.types";
import { CustomerSearchCard } from "../../components/common/CustomerSearchCard";
import { CustomerAccountSelect } from "../../components/common/CustomerAccountSelect";

const formatDateForInput = (date: Date | string): string => {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const TimeAccountUpdatePage: React.FC = () => {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(
    null,
  );
  const [accountData, setAccountData] = useState<any>(null);

  // Form State'leri
  const [maturityDays, setMaturityDays] = useState<number | string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [renewalType, setRenewalType] = useState<RenewalType>(
    "PRINCIPAL_AND_INTEREST",
  );
  const [targetAccountId, setTargetAccountId] = useState<number | null>(null);

  // Dinamik Faiz Bilgisi
  const [interestRate, setInterestRate] = useState<string>("");
  const [isLoadingRate, setIsLoadingRate] = useState<boolean>(false);
  const [rateError, setRateError] = useState<string | null>(null);
  const [weekendWarning, setWeekendWarning] = useState<string | null>(null);

  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // 2. Vade Günü Değiştikçe Tablodan Yeni Faiz Oranını Çek
  useEffect(() => {
    const days = Number(maturityDays);
    if (accountData && days > 0) {
      setIsLoadingRate(true);
      setRateError(null);

      api
        .get(`/accounts/interest-rate-preview`, {
          params: {
            currencyId: accountData.currencyId,
            termDays: days,
            amount: Number(accountData.balance),
          },
        })
        .then((res) => {
          setInterestRate(String(res.data.data.rate));
          setRateError(null);
        })
        .catch((err) => {
          setInterestRate("");
          setRateError(
            err.response?.data?.message ||
              "Bu aralık için geçerli faiz bulunamadı.",
          );
        })
        .finally(() => setIsLoadingRate(false));
    }
  }, [maturityDays, accountData]);

  // Hafta sonu kaydırma fonksiyonu
  const adjustToNextBusinessDay = (date: Date) => {
    const d = new Date(date);
    let wasWeekend = false;
    if (d.getDay() === 6) {
      d.setDate(d.getDate() + 2);
      wasWeekend = true;
    } else if (d.getDay() === 0) {
      d.setDate(d.getDate() + 1);
      wasWeekend = true;
    }
    return { adjustedDate: d, wasWeekend };
  };

  const handleDaysChange = (val: string) => {
    setMaturityDays(val);
    const num = Number(val);
    if (!isNaN(num) && num > 0 && startDate) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + num);
      const { adjustedDate, wasWeekend } = adjustToNextBusinessDay(d);
      setEndDate(formatDateForInput(adjustedDate));
      setWeekendWarning(
        wasWeekend
          ? "Bitiş tarihi hafta sonuna denk geldiği için Pazartesi gününe ötelendi."
          : null,
      );
    }
  };

  // Tahmini Brüt Faiz Getirisi
  const estimatedGrossInterest = useMemo(() => {
    const principal = Number(accountData?.balance || 0);
    const rate = Number(interestRate || 0);
    const days = Number(maturityDays || 0);
    return principal > 0 && rate > 0 && days > 0
      ? (principal * rate * days) / 36500
      : 0;
  }, [accountData, interestRate, maturityDays]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccountId) return;

    if (renewalType !== "PRINCIPAL_AND_INTEREST" && !targetAccountId) {
      setNotification({
        type: "error",
        message:
          "Lütfen vade sonu bakiye aktarımı için hedef vadesiz hesabı seçiniz.",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      setNotification(null);

      await api.put(`/accounts/time-deposit/${selectedAccountId}`, {
        maturityDays: Number(maturityDays),
        maturityStart: new Date(startDate),
        maturityEnd: new Date(endDate),
        renewalType,
        targetAccountId:
          renewalType !== "PRINCIPAL_AND_INTEREST" ? targetAccountId : null,
      });

      setNotification({
        type: "success",
        message: "Vadeli hesap ve temdit koşulları başarıyla güncellendi.",
      });
    } catch (err: any) {
      setNotification({
        type: "error",
        message: err.response?.data?.message || "Güncelleme başarısız.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
        Vadeli Hesap Vade & Temdit Güncelleme
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Mevcut vadeli hesabın vade süresini, temdit tipini ve vade sonu aktarım
        hesaplarını bu ekrandan değiştirebilirsiniz.
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

      {/* 1. MÜŞTERİ SEÇİMİ */}
      <CustomerSearchCard
        selectedCustomer={selectedCustomer}
        onSelectCustomer={(c) => {
          setSelectedCustomer(c);
          setSelectedAccountId(null);
        }}
      />

      {/* 2. HESAP SEÇİMİ VE FORM */}
      {selectedCustomer && (
        <Card
          sx={{
            mt: 3,
            borderRadius: 3,
            boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 700, mb: 1, color: "#334155" }}
              >
                Güncellenecek Vadeli Hesabı Seçiniz:
              </Typography>
              <CustomerAccountSelect
                customerId={selectedCustomer.id}
                selectedAccountId={selectedAccountId}
                filterOnlyActive={true}
                includeClosed={false}
                allowedProductTypes={["TIME"]}
                onChange={(acc) => {
                  if (acc) {
                    setSelectedAccountId(acc.id);
                    setAccountData(acc); // Seçilen hesap doğrudan state'e atanıyor
                    setMaturityDays(acc.maturityDays || 30);
                    setStartDate(
                      formatDateForInput(acc.maturityStart || new Date()),
                    );
                    setEndDate(
                      formatDateForInput(acc.maturityEnd || new Date()),
                    );
                    setRenewalType(
                      (acc.renewalType as RenewalType) ||
                        "PRINCIPAL_AND_INTEREST",
                    );
                    setInterestRate(String(acc.interestRate || ""));
                    setNotification(null);
                  } else {
                    setSelectedAccountId(null);
                    setAccountData(null);
                  }
                }}
                label="Vadeli Hesap Seçiniz"
              />
            </Box>

            {accountData && (
              <form onSubmit={handleSubmit}>
                <Divider sx={{ my: 3 }} />
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {/* Bakiye Bilgisi */}
                  <Alert severity="info" icon={false}>
                    Mevcut Hesap Bakiyesi:{" "}
                    <strong>
                      {Number(accountData.balance).toLocaleString("tr-TR", {
                        minimumFractionDigits: 2,
                      })}{" "}
                      {accountData.currency.code}
                    </strong>{" "}
                    (Faiz oranı bu bakiye üzerinden hesaplanır)
                  </Alert>

                  {/* Vade Gün ve Tarih Alanları */}
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: 2,
                    }}
                  >
                    <TextField
                      label="Vade Süresi (Gün)"
                      type="number"
                      value={maturityDays}
                      onChange={(e) => handleDaysChange(e.target.value)}
                      required
                      size="small"
                      slotProps={{ htmlInput: { min: 1, max: 765 } }}
                    />
                    <TextField
                      label="Vade Başlangıç Tarihi"
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        handleDaysChange(String(maturityDays));
                      }}
                      required
                      size="small"
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                    <TextField
                      label="Vade Bitiş Tarihi"
                      type="date"
                      value={endDate}
                      disabled
                      size="small"
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  </Box>

                  {weekendWarning && (
                    <Alert severity="warning">{weekendWarning}</Alert>
                  )}

                  {/* Faiz Oranı & Temdit Seçimi */}
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1fr 2fr",
                      gap: 2,
                    }}
                  >
                    <TextField
                      label="Uygulanacak Yeni Faiz Oranı (%)"
                      value={
                        isLoadingRate
                          ? "Hesaplanıyor..."
                          : interestRate
                            ? `%${interestRate}`
                            : "Oran Yok"
                      }
                      disabled
                      error={!!rateError}
                      helperText={
                        rateError || "Tablodan otomatik eşleştirildi."
                      }
                      size="small"
                    />

                    <FormControl fullWidth size="small">
                      <InputLabel>Temdit Türü</InputLabel>
                      <Select
                        value={renewalType}
                        label="Temdit Türü"
                        onChange={(e) =>
                          setRenewalType(e.target.value as RenewalType)
                        }
                      >
                        <MenuItem value="PRINCIPAL_AND_INTEREST">
                          Anapara + Faiz Yenilensin
                        </MenuItem>
                        <MenuItem value="PRINCIPAL_ONLY">
                          Sadece Anapara Yenilensin (Faiz Aktar)
                        </MenuItem>
                        <MenuItem value="CLOSE">
                          Vade Sonunda Otomatik Kapansın
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </Box>

                  {/* Temdit Farklı Hesap İse Hedef Hesap Seçimi */}
                  {renewalType !== "PRINCIPAL_AND_INTEREST" && (
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 700,
                          color: "#475569",
                          display: "block",
                          mb: 0.5,
                        }}
                      >
                        Vade Sonu Tutarların Aktarılacağı Hedef Vadesiz Hesap:
                      </Typography>
                      <CustomerAccountSelect
                        customerId={selectedCustomer.id}
                        selectedAccountId={targetAccountId}
                        filterOnlyActive={true}
                        includeClosed={false}
                        onChange={(acc) =>
                          setTargetAccountId(acc ? acc.id : null)
                        }
                        label="Hedef Vadesiz Hesabı Seçiniz"
                      />
                    </Box>
                  )}

                  {/* Yeni Getiri Bilgi Kartı */}
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2.5,
                      bgcolor: "#f8fafc",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                    >
                      <TrendingUpIcon color="success" sx={{ fontSize: 32 }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Yeni Vade Sonu Tahmini Getiri:
                        </Typography>
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 800, color: "#16a34a" }}
                        >
                          {estimatedGrossInterest.toLocaleString("tr-TR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{" "}
                          {accountData.currency.code}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="caption" sx={{ color: "#64748b" }}>
                      Yeni Periyot: <strong>{startDate}</strong> ➔{" "}
                      <strong>{endDate}</strong> ({maturityDays} Gün)
                    </Typography>
                  </Paper>

                  <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={<EditCalendarIcon />}
                      disabled={
                        isSubmitting ||
                        isLoadingRate ||
                        !interestRate ||
                        !!rateError
                      }
                      sx={{ px: 4, py: 1.2, fontWeight: 700 }}
                    >
                      {isSubmitting ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : (
                        "Değişiklikleri Kaydet"
                      )}
                    </Button>
                  </Box>
                </Box>
              </form>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};
