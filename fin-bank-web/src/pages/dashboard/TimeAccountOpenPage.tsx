import React, { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import moment from "moment";
import { z } from "zod";
import { useFormik } from "formik";
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
  FormHelperText,
  InputAdornment,
  Tooltip,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import PrintIcon from "@mui/icons-material/Print";
import AddIcon from "@mui/icons-material/Add";
import api from "../../services/api";
import type { Customer } from "../../types/customer.types";
import type {
  Product,
  Currency,
  ProductCurrency,
} from "../../types/account.types";
import { CustomerSearchCard } from "../../components/common/CustomerSearchCard";
import { CustomerAccountSelect } from "../../components/common/CustomerAccountSelect";
import { ReceiptPrintModal } from "../../components/ReceiptPrintModal";
import type { IReceiptData } from "../../components/ReceiptPrintModal";
import {
  isNonWorkingDay,
  getNextBusinessDay,
  getAvailableValors,
} from "../../utils/dateUtils";

// --- ZOD ŞEMASI ---
const timeAccountSchema = z
  .object({
    accountName: z.string().min(3, "Hesap adı en az 3 karakter olmalıdır."),
    currencyId: z.number().min(1, "Lütfen para birimi seçiniz."),
    maturityDays: z.coerce
      .number()
      .min(1, "Vade en az 1 gün olmalıdır.")
      .max(765, "Vade en fazla 765 gün olabilir."),
    initialAmount: z
      .string()
      .min(1, "Açılış tutarı girilmelidir.")
      .refine(
        (val) => /^\d+(\.\d{1,2})?$/.test(val),
        "Tutar noktadan sonra en fazla 2 ondalık basamak içerebilir (Örn: 1000.50)",
      )
      .refine((val) => Number(val) > 0, "Açılış tutarı 0'dan büyük olmalıdır."),
    sourceAccountId: z
      .number({ message: "Kaynak hesap zorunludur." })
      .min(1, "Lütfen kaynak vadesiz hesap seçiniz."),
    renewalType: z.enum(["PRINCIPAL_AND_INTEREST", "PRINCIPAL_ONLY", "CLOSE"]),
    targetAccountId: z.number().nullable().optional(),
  })
  .refine(
    (data) => {
      if (
        data.renewalType !== "PRINCIPAL_AND_INTEREST" &&
        !data.targetAccountId
      ) {
        return false;
      }
      return true;
    },
    {
      message:
        "Seçilen temdit türü için vade sonunda aktarım yapılacak hedef vadesiz hesap seçilmelidir.",
      path: ["targetAccountId"],
    },
  );

type TimeAccountFormValues = z.infer<typeof timeAccountSchema>;

export const TimeAccountOpenPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );

  // Valör Günleri (dateUtils)
  const { t0Date, t1Date } = useMemo(() => getAvailableValors(), []);

  // Tarih State'leri
  const [startDate, setStartDate] = useState<string>(t0Date);
  const [endDate, setEndDate] = useState<string>(() => {
    const rawTarget = moment(t0Date).add(32, "days");
    return getNextBusinessDay(rawTarget).date;
  });

  // Hata Yönetimi
  const [dateError, setDateError] = useState<string | null>(null);
  const dateErrorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const showTemporaryDateError = (msg: string) => {
    if (dateErrorTimeoutRef.current) clearTimeout(dateErrorTimeoutRef.current);
    setDateError(msg);
    dateErrorTimeoutRef.current = setTimeout(() => {
      setDateError(null);
    }, 4000);
  };

  // Faiz Oranı State'leri
  const [interestRate, setInterestRate] = useState<string>("");
  const [isLoadingRate, setIsLoadingRate] = useState<boolean>(false);
  const [rateError, setRateError] = useState<string | null>(null);

  // Parametreler
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [timeProductId, setTimeProductId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Başarılı Açılış Sonrası Form Kilitleme State'i
  const [isAccountCreated, setIsAccountCreated] = useState<boolean>(false);

  // İsteğe Bağlı Fiş Yazdırma State'leri
  const [autoPrintReceipt, setAutoPrintReceipt] = useState<boolean>(true);
  const [openReceiptModal, setOpenReceiptModal] = useState<boolean>(false);
  const [selectedReceipt, setSelectedReceipt] = useState<IReceiptData | null>(
    null,
  );
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // 1. URL'den customerId gelmişse yükle
  useEffect(() => {
    const customerIdParam = searchParams.get("customerId");
    if (customerIdParam) {
      api
        .get<{ success: boolean; data: Customer[] }>("/customers")
        .then((res) => {
          const found = (res.data.data || []).find(
            (c) => c.id === Number(customerIdParam),
          );
          if (found) setSelectedCustomer(found);
        })
        .catch((err) => console.error("Müşteri yüklenemedi:", err));
    }
  }, [searchParams]);

  // 2. Parametreleri Çek
  useEffect(() => {
    api
      .get<{
        success: boolean;
        data: {
          products: Product[];
          currencies: Currency[];
          productCurrencies: ProductCurrency[];
        };
      }>("/accounts/parameters")
      .then((res) => {
        const timeProd = res.data.data.products.find((p) => p.type === "TIME");
        if (timeProd) setTimeProductId(timeProd.id);
        setCurrencies(res.data.data.currencies);
        if (res.data.data.currencies.length > 0) {
          formik.setFieldValue("currencyId", res.data.data.currencies[0].id);
        }
      })
      .catch((err) => console.error("Parametreler alınamadı:", err));
  }, []);

  // FORMIK
  const formik = useFormik<TimeAccountFormValues>({
    initialValues: {
      accountName: "",
      currencyId: 0,
      maturityDays: 32,
      initialAmount: "",
      sourceAccountId: 0,
      renewalType: "PRINCIPAL_AND_INTEREST",
      targetAccountId: null,
    },
    validate: (values) => {
      const result = timeAccountSchema.safeParse(values);
      if (!result.success) {
        const errors: Record<string, string> = {};
        result.error.issues.forEach((issue) => {
          if (issue.path[0]) errors[issue.path[0].toString()] = issue.message;
        });
        return errors;
      }
      return {};
    },
    onSubmit: async (values) => {
      if (!selectedCustomer || !timeProductId) return;

      if (!interestRate || rateError) {
        setNotification({
          type: "error",
          message: "Geçerli bir faiz oranı olmadan vadeli hesap açılamaz.",
        });
        return;
      }

      if (dateError) {
        setNotification({
          type: "error",
          message:
            "Lütfen hafta sonuna veya tatil gününe denk gelmeyen geçerli bir iş günü belirleyiniz.",
        });
        return;
      }

      try {
        setIsSubmitting(true);
        setNotification(null);

        const res = await api.post("/accounts", {
          customerId: selectedCustomer.id,
          productId: timeProductId,
          currencyId: values.currencyId,
          name: values.accountName.trim(),
          initialAmount: Number(values.initialAmount),
          sourceAccountId: values.sourceAccountId,
          targetAccountId:
            values.renewalType !== "PRINCIPAL_AND_INTEREST"
              ? values.targetAccountId
              : undefined,
          renewalType: values.renewalType,
          maturityDays: Number(values.maturityDays),
          maturityStart: new Date(startDate),
          maturityEnd: new Date(endDate),
        });

        // 1. İşlem tekrarını engellemek için formu kilitle
        setIsAccountCreated(true);

        setNotification({
          type: "success",
          message:
            "Vadeli hesap açılışı ve başlangıç virmanı başarıyla tamamlandı.",
        });

        // 2. Fiş Verisini Al ve İsteğe Bağlı Yazdır
        const newAccountId = res.data.data?.id || res.data.id;
        if (newAccountId) {
          const receiptRes = await api.get(
            `/accounting?accountId=${newAccountId}`,
          );
          if (receiptRes.data.data?.length > 0) {
            const receipt = receiptRes.data.data[0];
            setSelectedReceipt(receipt);

            // Checkbox işaretliyse otomatik aç
            if (autoPrintReceipt) {
              setOpenReceiptModal(true);
            }
          }
        }
      } catch (err: any) {
        setNotification({
          type: "error",
          message: err.response?.data?.message || "Vadeli hesap açılamadı.",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  // Yeni Hesap Açma Butonuna basıldığında formu ve kilitleri sıfırla
  const handleResetForNewAccount = () => {
    setIsAccountCreated(false);
    setSelectedReceipt(null);
    setNotification(null);
    setDateError(null);

    const defaultT0 = t0Date;
    setStartDate(defaultT0);
    const rawTarget = moment(defaultT0).add(32, "days");
    setEndDate(getNextBusinessDay(rawTarget).date);

    formik.resetForm({
      values: {
        accountName: selectedCustomer
          ? `${selectedCustomer.firstName} Vadeli ${
              currencies.find((c) => c.id === formik.values.currencyId)?.code ||
              "TRY"
            } Hesabı`
          : "",
        currencyId: formik.values.currencyId || (currencies[0]?.id ?? 0),
        maturityDays: 32,
        initialAmount: "",
        sourceAccountId: 0,
        renewalType: "PRINCIPAL_AND_INTEREST",
        targetAccountId: null,
      },
    });
  };

  // Müşteri / Döviz değiştikçe otomatik hesap adını set et
  useEffect(() => {
    if (selectedCustomer && formik.values.currencyId && !isAccountCreated) {
      const curr = currencies.find((c) => c.id === formik.values.currencyId);
      if (curr) {
        formik.setFieldValue(
          "accountName",
          `${selectedCustomer.firstName} Vadeli ${curr.code} Hesabı`,
        );
      }
    }
  }, [
    selectedCustomer,
    formik.values.currencyId,
    currencies,
    isAccountCreated,
  ]);

  // Vade Başlangıcı Tıklama ile Değişimi (T0 <-> T1)
  const toggleStartDate = () => {
    if (isAccountCreated) return;

    const nextDate = startDate === t0Date ? t1Date : t0Date;
    setStartDate(nextDate);

    const days = Number(formik.values.maturityDays || 32);
    const computedEnd = moment(nextDate).add(days, "days");
    setEndDate(computedEnd.format("YYYY-MM-DD"));

    if (isNonWorkingDay(computedEnd)) {
      showTemporaryDateError(
        "Vade bitiş tarihi hafta sonuna veya resmi tatile denk gelmektedir. Lütfen iş günü seçiniz.",
      );
    } else {
      if (dateErrorTimeoutRef.current)
        clearTimeout(dateErrorTimeoutRef.current);
      setDateError(null);
    }
  };

  // Gün kutusuna sayı girildiğinde bitiş tarihini hesapla
  const handleDaysChange = (daysVal: string) => {
    formik.setFieldValue("maturityDays", daysVal);
    const numDays = Number(daysVal);

    if (!isNaN(numDays) && numDays > 0) {
      const computedEnd = moment(startDate).add(numDays, "days");
      setEndDate(computedEnd.format("YYYY-MM-DD"));

      if (isNonWorkingDay(computedEnd)) {
        showTemporaryDateError(
          "Seçilen gün hafta sonu veya resmi tatile denk gelmektedir. Lütfen iş günü seçiniz.",
        );
      } else {
        if (dateErrorTimeoutRef.current)
          clearTimeout(dateErrorTimeoutRef.current);
        setDateError(null);
      }
    } else {
      if (dateErrorTimeoutRef.current)
        clearTimeout(dateErrorTimeoutRef.current);
      setDateError(null);
    }
  };

  // Dinamik Faiz Oranı Çekme
  useEffect(() => {
    const days = Number(formik.values.maturityDays);
    const amount = Number(formik.values.initialAmount);
    const currId = formik.values.currencyId;

    if (currId && days > 0 && amount > 0) {
      setIsLoadingRate(true);
      setRateError(null);

      api
        .get(`/accounts/interest-rate-preview`, {
          params: { currencyId: currId, termDays: days, amount: amount },
        })
        .then((res) => {
          setInterestRate(String(res.data.data.rate));
          setRateError(null);
        })
        .catch((err) => {
          setInterestRate("");
          setRateError(
            err.response?.data?.message ||
              "Bu tutar ve vade aralığı için tanımlı faiz oranı bulunamadı.",
          );
        })
        .finally(() => setIsLoadingRate(false));
    } else {
      setInterestRate("");
      setRateError(null);
    }
  }, [
    formik.values.currencyId,
    formik.values.maturityDays,
    formik.values.initialAmount,
  ]);

  // Tahmini Getiri
  const estimatedGrossInterest = useMemo(() => {
    const principal = Number(formik.values.initialAmount || 0);
    const rate = Number(interestRate || 0);
    const days = Number(formik.values.maturityDays || 0);
    if (principal > 0 && rate > 0 && days > 0) {
      return (principal * rate * days) / 36500;
    }
    return 0;
  }, [formik.values.initialAmount, interestRate, formik.values.maturityDays]);

  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
          Vadeli Hesap Açılış İşlemleri
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Müşterinin vadesiz hesabından kaynak tutar aktararak dinamik faiz ve
          vade kurallarıyla vadeli mevduat hesabı tanımlayabilirsiniz.
        </Typography>

        {/* BİLDİRİM VE HIZLI FİŞ YAZDIRMA BUTONU */}
        {notification && (
          <Alert
            severity={notification.type}
            sx={{ mb: 3 }}
            onClose={() => setNotification(null)}
            action={
              notification.type === "success" && selectedReceipt ? (
                <Button
                  color="inherit"
                  size="small"
                  startIcon={<PrintIcon />}
                  onClick={() => setOpenReceiptModal(true)}
                  sx={{ fontWeight: 700 }}
                >
                  Fişi Yazdır
                </Button>
              ) : undefined
            }
          >
            {notification.message}
          </Alert>
        )}

        {/* 1. MÜŞTERİ SEÇİM KARTI */}
        <CustomerSearchCard
          selectedCustomer={selectedCustomer}
          onSelectCustomer={(c) => {
            setSelectedCustomer(c);
            setIsAccountCreated(false);
            formik.setFieldValue("sourceAccountId", 0);
            formik.setFieldValue("targetAccountId", null);
          }}
        />

        {/* 2. VADELİ AÇILIŞ FORMU */}
        {selectedCustomer ? (
          <Card
            sx={{
              mt: 3,
              borderRadius: 3,
              boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <form onSubmit={formik.handleSubmit}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {/* 1. SATIR: HESAP ADI & DÖVİZ */}
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "2fr 1fr",
                      gap: 2,
                    }}
                  >
                    <TextField
                      label="Hesap Adı / Tanımı"
                      name="accountName"
                      disabled={isAccountCreated}
                      value={formik.values.accountName}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.accountName &&
                        Boolean(formik.errors.accountName)
                      }
                      helperText={
                        formik.touched.accountName && formik.errors.accountName
                      }
                      fullWidth
                      size="small"
                    />

                    <FormControl
                      fullWidth
                      size="small"
                      disabled={isAccountCreated}
                      error={
                        formik.touched.currencyId &&
                        Boolean(formik.errors.currencyId)
                      }
                    >
                      <InputLabel>Para Birimi</InputLabel>
                      <Select
                        name="currencyId"
                        value={formik.values.currencyId || ""}
                        label="Para Birimi"
                        onChange={(e) => {
                          formik.setFieldValue(
                            "currencyId",
                            Number(e.target.value),
                          );
                          formik.setFieldValue("sourceAccountId", 0);
                          formik.setFieldValue("targetAccountId", null);
                        }}
                      >
                        {currencies.map((c) => (
                          <MenuItem key={c.id} value={c.id}>
                            {c.code} — {c.name}
                          </MenuItem>
                        ))}
                      </Select>
                      {formik.touched.currencyId &&
                        formik.errors.currencyId && (
                          <FormHelperText>
                            {formik.errors.currencyId}
                          </FormHelperText>
                        )}
                    </FormControl>
                  </Box>

                  {/* 2. SATIR: VADE GÜNÜ, VADE BAŞLANGICI VE BİTİŞ TAKVİMİ */}
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1.3fr 1.3fr",
                      gap: 2,
                    }}
                  >
                    {/* Vade Süresi (Gün) */}
                    <TextField
                      label="Vade Süresi"
                      name="maturityDays"
                      type="number"
                      disabled={isAccountCreated}
                      value={formik.values.maturityDays}
                      onChange={(e) => handleDaysChange(e.target.value)}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.maturityDays &&
                        Boolean(formik.errors.maturityDays)
                      }
                      helperText={
                        formik.touched.maturityDays &&
                        formik.errors.maturityDays
                      }
                      fullWidth
                      size="small"
                      slotProps={{ htmlInput: { min: 1, max: 765 } }}
                    />

                    {/* Vade Başlangıcı (T0 <-> T1 Geçişi) */}
                    <Tooltip
                      title={
                        isAccountCreated
                          ? "Hesap açıldı, değiştirilemez"
                          : "Tıklayarak ilk iş günü ile bir sonraki iş günü arasında geçiş yapabilirsiniz"
                      }
                    >
                      <TextField
                        label="Vade Başlangıç"
                        disabled={isAccountCreated}
                        value={`${moment(startDate).format("DD.MM.YYYY")} (${
                          startDate === t0Date
                            ? "İlk İş Günü"
                            : "Sonraki İş Günü"
                        })`}
                        onClick={toggleStartDate}
                        fullWidth
                        size="small"
                        helperText={
                          isAccountCreated
                            ? "İşlem tamamlandı."
                            : "Tıklayarak valörü değiştirebilirsiniz."
                        }
                        slotProps={{
                          input: {
                            readOnly: true,
                            sx: {
                              cursor: isAccountCreated ? "default" : "pointer",
                              bgcolor: "#f8fafc",
                            },
                            endAdornment: !isAccountCreated ? (
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

                    {/* Vade Bitiş Tarihi (MUI DatePicker) */}
                    <DatePicker
                      label="Vade Bitiş Tarihi"
                      disabled={isAccountCreated}
                      value={moment(endDate, "YYYY-MM-DD")}
                      format="DD.MM.YYYY"
                      shouldDisableDate={(day) => isNonWorkingDay(day)}
                      minDate={moment(startDate, "YYYY-MM-DD").add(1, "days")}
                      onChange={(newVal) => {
                        if (newVal && newVal.isValid()) {
                          const chosen = newVal.format("YYYY-MM-DD");
                          setEndDate(chosen);

                          if (dateErrorTimeoutRef.current)
                            clearTimeout(dateErrorTimeoutRef.current);
                          setDateError(null);

                          const diff = newVal.diff(
                            moment(startDate, "YYYY-MM-DD"),
                            "days",
                          );
                          formik.setFieldValue(
                            "maturityDays",
                            diff > 0 ? diff : 1,
                          );
                        }
                      }}
                      slotProps={{
                        textField: {
                          size: "small",
                          fullWidth: true,
                          error: Boolean(dateError),
                          helperText:
                            dateError || "Tatil ve hafta sonları seçilemez.",
                        },
                      }}
                    />
                  </Box>

                  {/* Süreli Hata Alanı */}
                  {dateError && (
                    <Alert
                      severity="error"
                      sx={{ py: 0.5 }}
                      onClose={() => {
                        if (dateErrorTimeoutRef.current)
                          clearTimeout(dateErrorTimeoutRef.current);
                        setDateError(null);
                      }}
                    >
                      {dateError}
                    </Alert>
                  )}

                  {/* 3. SATIR: TUTAR (2 ONDALIK KONTROLÜ), KİLİTLİ FAİZ ORANI & TEMDİT */}
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1.2fr 1fr 1.5fr",
                      gap: 2,
                    }}
                  >
                    <TextField
                      label="Açılış Tutarı (Anapara)"
                      name="initialAmount"
                      type="text"
                      disabled={isAccountCreated}
                      value={formik.values.initialAmount}
                      onChange={(e) => {
                        const val = e.target.value.replace(",", ".");
                        if (/^\d*\.?\d*$/.test(val)) {
                          formik.setFieldValue("initialAmount", val);
                        }
                      }}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.initialAmount &&
                        Boolean(formik.errors.initialAmount)
                      }
                      helperText={
                        (formik.touched.initialAmount &&
                          formik.errors.initialAmount) ||
                        "Noktadan sonra en fazla 2 basamak (Örn: 5000.50)"
                      }
                      fullWidth
                      size="small"
                    />

                    <TextField
                      label="Faiz Oranı (%)"
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
                        rateError || "Sistem tarafından otomatik getirilir."
                      }
                      fullWidth
                      size="small"
                    />

                    <FormControl
                      fullWidth
                      size="small"
                      disabled={isAccountCreated}
                    >
                      <InputLabel>Temdit Türü</InputLabel>
                      <Select
                        name="renewalType"
                        value={formik.values.renewalType}
                        label="Temdit Türü"
                        onChange={formik.handleChange}
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

                  {/* 4. SATIR: KAYNAK VE HEDEF HESAPLAR */}
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns:
                        formik.values.renewalType !== "PRINCIPAL_AND_INTEREST"
                          ? "1fr 1fr"
                          : "1fr",
                      gap: 2,
                    }}
                  >
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
                        Tutarın Çekileceği Kaynak Vadesiz Hesap:
                      </Typography>
                      <CustomerAccountSelect
                        customerId={selectedCustomer.id}
                        selectedAccountId={
                          formik.values.sourceAccountId || null
                        }
                        filterOnlyActive={true}
                        includeClosed={false}
                        disabled={isAccountCreated}
                        allowedProductTypes={["DEMAND"]}
                        onChange={(acc) => {
                          if (!isAccountCreated) {
                            formik.setFieldValue(
                              "sourceAccountId",
                              acc ? acc.id : 0,
                            );
                          }
                        }}
                        label="Kaynak Vadesiz Hesabı Seçiniz"
                      />
                      {formik.touched.sourceAccountId &&
                        formik.errors.sourceAccountId && (
                          <Typography
                            variant="caption"
                            color="error"
                            sx={{ mt: 0.5 }}
                          >
                            {formik.errors.sourceAccountId}
                          </Typography>
                        )}
                    </Box>

                    {formik.values.renewalType !== "PRINCIPAL_AND_INTEREST" && (
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
                          Vade Sonu Paranın Aktarılacağı Hedef Vadesiz Hesap:
                        </Typography>
                        <CustomerAccountSelect
                          customerId={selectedCustomer.id}
                          selectedAccountId={formik.values.targetAccountId}
                          filterOnlyActive={true}
                          includeClosed={false}
                          disabled={isAccountCreated}
                          allowedProductTypes={["DEMAND"]}
                          onChange={(acc) => {
                            if (!isAccountCreated) {
                              formik.setFieldValue(
                                "targetAccountId",
                                acc ? acc.id : null,
                              );
                            }
                          }}
                          label="Hedef Vadesiz Hesabı Seçiniz"
                        />
                        {formik.touched.targetAccountId &&
                          formik.errors.targetAccountId && (
                            <Typography
                              variant="caption"
                              color="error"
                              sx={{ mt: 0.5 }}
                            >
                              {formik.errors.targetAccountId}
                            </Typography>
                          )}
                      </Box>
                    )}
                  </Box>

                  {/* 5. GETİRİ VE BİLGİ KARTI */}
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2.5,
                      bgcolor: "#f8fafc",
                      borderRadius: 2.5,
                      border: "1px solid #e2e8f0",
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
                          Vade Sonu Tahmini Brüt Faiz Getirisi:
                        </Typography>
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 800, color: "#16a34a" }}
                        >
                          {estimatedGrossInterest.toLocaleString("tr-TR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{" "}
                          {currencies.find(
                            (c) => c.id === formik.values.currencyId,
                          )?.code || "TRY"}
                        </Typography>
                      </Box>
                    </Box>

                    <Typography
                      variant="caption"
                      sx={{ color: "#64748b", textAlign: "right" }}
                    >
                      Vade:{" "}
                      <strong>{moment(startDate).format("DD.MM.YYYY")}</strong>{" "}
                      ➔ <strong>{moment(endDate).format("DD.MM.YYYY")}</strong>{" "}
                      ({formik.values.maturityDays} Gün)
                    </Typography>
                  </Paper>

                  <Divider />

                  {/* ALT BUTON VE FİŞ YAZDIRMA TERCİHİ ALANI */}
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    {/* İsteğe Bağlı Fiş Checkbox'ı */}
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={autoPrintReceipt}
                          onChange={(e) =>
                            setAutoPrintReceipt(e.target.checked)
                          }
                          color="primary"
                          disabled={isAccountCreated}
                        />
                      }
                      label={
                        <Typography variant="body2" sx={{ color: "#475569" }}>
                          İşlem tamamlandığında muhasebe fişini otomatik ekrana
                          getir
                        </Typography>
                      }
                    />

                    {/* Aksiyon Butonları */}
                    <Box sx={{ display: "flex", gap: 2 }}>
                      {isAccountCreated ? (
                        <Button
                          variant="outlined"
                          color="primary"
                          startIcon={<AddIcon />}
                          onClick={handleResetForNewAccount}
                          sx={{
                            borderRadius: 2,
                            px: 3,
                            py: 1.2,
                            textTransform: "none",
                            fontWeight: 700,
                          }}
                        >
                          Yeni Vadeli Hesap Aç
                        </Button>
                      ) : (
                        <Button
                          type="submit"
                          variant="contained"
                          startIcon={<AccessTimeIcon />}
                          disabled={
                            isSubmitting ||
                            isLoadingRate ||
                            !interestRate ||
                            Boolean(rateError) ||
                            Boolean(dateError)
                          }
                          sx={{
                            borderRadius: 2,
                            px: 4,
                            py: 1.2,
                            textTransform: "none",
                            fontWeight: 700,
                            fontSize: "0.95rem",
                          }}
                        >
                          {isSubmitting ? (
                            <CircularProgress size={24} color="inherit" />
                          ) : (
                            "Vadeli Hesabı Aç & Virmanı Tamamla"
                          )}
                        </Button>
                      )}
                    </Box>
                  </Box>
                </Box>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Alert severity="info" sx={{ mt: 2 }}>
            Vadeli hesap açabilmek için lütfen yukarıdaki arama alanından işlem
            yapılacak müşteriyi çağırınız.
          </Alert>
        )}

        {/* MUHASEBE FİŞİ YAZDIRMA MODALI */}
        <ReceiptPrintModal
          open={openReceiptModal}
          onClose={() => setOpenReceiptModal(false)}
          data={selectedReceipt}
        />
      </Box>
    </LocalizationProvider>
  );
};
