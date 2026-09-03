import React, { useState, useEffect, useMemo } from "react";
import moment from "moment";
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
  InputAdornment,
  Tooltip,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import EditCalendarIcon from "@mui/icons-material/EditCalendar";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import EditIcon from "@mui/icons-material/Edit";
import api from "../../services/api";
import type { Customer } from "../../types/customer.types";
import type { RenewalType } from "../../types/account.types";
import { CustomerSearchCard } from "../../components/common/CustomerSearchCard";
import { CustomerAccountSelect } from "../../components/common/CustomerAccountSelect";
import { isNonWorkingDay, getAvailableValors } from "../../utils/dateUtils";

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

  // Valör Günleri (T0 ve T1)
  const { t0Date, t1Date } = useMemo(() => getAvailableValors(), []);

  // Hesap bugün açıldı mı kontrolü
  const isCreatedToday = useMemo(() => {
    if (!accountData?.createdAt) return false;
    return moment(accountData.createdAt).isSame(moment(), "day");
  }, [accountData]);

  // Hata & Bildirim State'leri
  const [hasDateError, setHasDateError] = useState<boolean>(false);

  // Dinamik Faiz Bilgisi
  const [interestRate, setInterestRate] = useState<string>("");
  const [isLoadingRate, setIsLoadingRate] = useState<boolean>(false);
  const [rateError, setRateError] = useState<string | null>(null);

  // Başarılı Güncelleme Sonrası Kilitleme State'i
  const [isUpdatedSuccess, setIsUpdatedSuccess] = useState<boolean>(false);

  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Vade Günü / Tutara Göre Faiz Oranını Güncelle
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

  // Vade Başlangıcı Değiştirme (Aynı gün açıldıysa T0 <-> T1 Toggle)
  const toggleStartDate = () => {
    if (!isCreatedToday || isUpdatedSuccess) return;

    const nextDate = startDate === t0Date ? t1Date : t0Date;
    setStartDate(nextDate);

    const days = Number(maturityDays || 30);
    const computedEnd = moment(nextDate).add(days, "days");
    setEndDate(computedEnd.format("YYYY-MM-DD"));

    if (isNonWorkingDay(computedEnd)) {
      setHasDateError(true);
      setNotification({
        type: "error",
        message:
          "Vade bitiş tarihi hafta sonu veya tatil gününe denk gelmektedir. Lütfen iş günü seçiniz.",
      });
    } else {
      setHasDateError(false);
      if (notification?.message?.includes("Vade bitiş")) {
        setNotification(null);
      }
    }
  };

  // Gün Sayısı Girişi -> Bitiş Tarihi Hesabı
  const handleDaysChange = (val: string) => {
    setMaturityDays(val);
    const num = Number(val);
    if (!isNaN(num) && num > 0 && startDate) {
      const computedEnd = moment(startDate).add(num, "days");
      setEndDate(computedEnd.format("YYYY-MM-DD"));

      if (isNonWorkingDay(computedEnd)) {
        setHasDateError(true);
        setNotification({
          type: "error",
          message:
            "Seçilen gün sayısı hafta sonuna veya resmi tatile denk gelmektedir. Lütfen iş günü belirleyiniz.",
        });
      } else {
        setHasDateError(false);
        if (notification?.message?.includes("gün sayısı")) {
          setNotification(null);
        }
      }
    } else {
      setHasDateError(false);
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

    if (hasDateError) {
      setNotification({
        type: "error",
        message: "Lütfen geçerli bir iş günü belirleyiniz.",
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

      // İşlem başarılı: Form alanlarını kilitle
      setIsUpdatedSuccess(true);

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
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
          Vadeli Hesap Vade & Temdit Güncelleme
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Mevcut vadeli hesabın vade süresini, temdit tipini ve vade sonu
          aktarım hesaplarını bu ekrandan değiştirebilirsiniz.
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
            setAccountData(null);
            setIsUpdatedSuccess(false);
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
                    setIsUpdatedSuccess(false);
                    if (acc) {
                      setSelectedAccountId(acc.id);
                      setAccountData(acc);
                      setMaturityDays(acc.maturityDays || 30);
                      setStartDate(
                        moment(acc.maturityStart || new Date()).format(
                          "YYYY-MM-DD",
                        ),
                      );
                      setEndDate(
                        moment(acc.maturityEnd || new Date()).format(
                          "YYYY-MM-DD",
                        ),
                      );
                      setRenewalType(
                        (acc.renewalType as RenewalType) ||
                          "PRINCIPAL_AND_INTEREST",
                      );
                      setTargetAccountId(acc.targetAccountId || null);
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
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 3 }}
                  >
                    {/* Bakiye Bilgisi */}
                    <Alert severity="info" icon={false}>
                      Mevcut Hesap Bakiyesi:{" "}
                      <strong>
                        {Number(accountData.balance).toLocaleString("tr-TR", {
                          minimumFractionDigits: 2,
                        })}{" "}
                        {accountData.currency?.code || "TRY"}
                      </strong>{" "}
                      (Faiz oranı bu bakiye üzerinden hesaplanır)
                    </Alert>

                    {/* Vade Gün ve Tarih Alanları */}
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "1.3fr 1fr 1.3fr",
                        gap: 2,
                      }}
                    >
                      {/* Vade Başlangıç Tarihi */}
                      <Tooltip
                        title={
                          isUpdatedSuccess
                            ? "Güncelleme tamamlandı, alanlar kilitli"
                            : isCreatedToday
                              ? "Tıklayarak ilk iş günü ile bir sonraki iş günü arasında geçiş yapabilirsiniz"
                              : "Açılış gününü geçmiş hesaplarda valör değiştirilemez."
                        }
                      >
                        <TextField
                          label="Vade Başlangıç Tarihi"
                          disabled={isUpdatedSuccess}
                          value={`${moment(startDate).format("DD.MM.YYYY")} ${
                            isCreatedToday
                              ? `(${startDate === t0Date ? "İlk İş Günü" : "Sonraki İş Günü"})`
                              : ""
                          }`}
                          onClick={toggleStartDate}
                          size="small"
                          fullWidth
                          helperText={
                            isUpdatedSuccess
                              ? "İşlem tamamlandı."
                              : isCreatedToday
                                ? "Tıklayarak valörü değiştirebilirsiniz."
                                : "Vade periyodu başlangıç tarihi sabittir."
                          }
                          slotProps={{
                            input: {
                              readOnly: true,
                              sx: {
                                cursor:
                                  isCreatedToday && !isUpdatedSuccess
                                    ? "pointer"
                                    : "default",
                                bgcolor: "#f8fafc",
                              },
                              endAdornment:
                                isCreatedToday && !isUpdatedSuccess ? (
                                  <InputAdornment position="end">
                                    <SwapHorizIcon
                                      color="primary"
                                      sx={{ cursor: "pointer" }}
                                    />
                                  </InputAdornment>
                                ) : undefined,
                            },
                          }}
                        />
                      </Tooltip>

                      {/* Vade Süresi (Gün) */}
                      <TextField
                        label="Vade Süresi (Gün)"
                        type="number"
                        disabled={isUpdatedSuccess}
                        value={maturityDays}
                        onChange={(e) => handleDaysChange(e.target.value)}
                        required
                        size="small"
                        fullWidth
                        slotProps={{ htmlInput: { min: 1, max: 765 } }}
                      />

                      {/* Vade Bitiş Tarihi */}
                      <DatePicker
                        label="Vade Bitiş Tarihi"
                        disabled={isUpdatedSuccess}
                        value={moment(endDate, "YYYY-MM-DD")}
                        format="DD.MM.YYYY"
                        shouldDisableDate={(day) => isNonWorkingDay(day)}
                        minDate={moment(startDate, "YYYY-MM-DD").add(1, "days")}
                        onChange={(newVal) => {
                          if (newVal && newVal.isValid()) {
                            const chosen = newVal.format("YYYY-MM-DD");
                            setEndDate(chosen);
                            setHasDateError(false);

                            if (notification?.type === "error") {
                              setNotification(null);
                            }

                            const diff = newVal.diff(
                              moment(startDate, "YYYY-MM-DD"),
                              "days",
                            );
                            setMaturityDays(diff > 0 ? diff : 1);
                          }
                        }}
                        slotProps={{
                          textField: {
                            size: "small",
                            fullWidth: true,
                            error: hasDateError,
                            helperText: "Tatil ve hafta sonları seçilemez.",
                          },
                        }}
                      />
                    </Box>

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
                        error={Boolean(rateError)}
                        helperText={
                          rateError || "Tablodan otomatik eşleştirildi."
                        }
                        size="small"
                        fullWidth
                      />

                      <FormControl
                        fullWidth
                        size="small"
                        disabled={isUpdatedSuccess}
                      >
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
                            mb: 0.5,
                            display: "block",
                          }}
                        >
                          Vade Sonu Tutarların Aktarılacağı Hedef Vadesiz Hesap:
                        </Typography>
                        <CustomerAccountSelect
                          customerId={selectedCustomer.id}
                          selectedAccountId={targetAccountId}
                          filterOnlyActive={true}
                          includeClosed={false}
                          allowedProductTypes={["DEMAND"]}
                          onChange={(acc) => {
                            if (!isUpdatedSuccess) {
                              setTargetAccountId(acc ? acc.id : null);
                            }
                          }}
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
                            {accountData.currency?.code || "TRY"}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="caption" sx={{ color: "#64748b" }}>
                        Yeni Periyot:{" "}
                        <strong>
                          {moment(startDate).format("DD.MM.YYYY")}
                        </strong>{" "}
                        ➔{" "}
                        <strong>{moment(endDate).format("DD.MM.YYYY")}</strong>{" "}
                        ({maturityDays} Gün)
                      </Typography>
                    </Paper>

                    {/* Submit Butonu / Kilidi Açıp Yeniden Düzenleme */}
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: 2,
                      }}
                    >
                      {isUpdatedSuccess ? (
                        <Button
                          variant="outlined"
                          color="primary"
                          startIcon={<EditIcon />}
                          onClick={() => {
                            setIsUpdatedSuccess(false);
                            setNotification(null);
                          }}
                          sx={{
                            px: 3,
                            py: 1.2,
                            fontWeight: 700,
                            textTransform: "none",
                          }}
                        >
                          Yeniden Düzenle
                        </Button>
                      ) : (
                        <Button
                          type="submit"
                          variant="contained"
                          startIcon={<EditCalendarIcon />}
                          disabled={
                            isSubmitting ||
                            isLoadingRate ||
                            !interestRate ||
                            Boolean(rateError) ||
                            hasDateError
                          }
                          sx={{
                            px: 4,
                            py: 1.2,
                            fontWeight: 700,
                            textTransform: "none",
                          }}
                        >
                          {isSubmitting ? (
                            <CircularProgress size={24} color="inherit" />
                          ) : (
                            "Değişiklikleri Kaydet"
                          )}
                        </Button>
                      )}
                    </Box>
                  </Box>
                </form>
              )}
            </CardContent>
          </Card>
        )}
      </Box>
    </LocalizationProvider>
  );
};
