import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
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
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import api from "../../services/api";
import type { Customer } from "../../types/customer.types";
import type {
  Product,
  Currency,
  ProductCurrency,
  RenewalType,
} from "../../types/account.types";
import { CustomerSearchCard } from "../../components/common/CustomerSearchCard";
import { CustomerAccountSelect } from "../../components/common/CustomerAccountSelect";
import { ReceiptPrintModal } from "../../components/ReceiptPrintModal";
import type { IReceiptData } from "../../components/ReceiptPrintModal";

const formatDateForInput = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export const TimeAccountOpenPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );

  // Form State'leri
  const [accountName, setAccountName] = useState<string>("");
  const [selectedCurrencyId, setSelectedCurrencyId] = useState<number | "">("");
  const [initialAmount, setInitialAmount] = useState<string>("");
  const [sourceAccountId, setSourceAccountId] = useState<number | null>(null);
  const [targetAccountId, setTargetAccountId] = useState<number | null>(null);

  // Vade & Tarih State'leri
  const [maturityDays, setMaturityDays] = useState<number | string>(32);
  const [startDate, setStartDate] = useState<string>(
    formatDateForInput(new Date()),
  );
  const [endDate, setEndDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 32);
    return formatDateForInput(d);
  });

  // Dinamik Faiz Oranı State'leri
  const [interestRate, setInterestRate] = useState<string>("");
  const [isLoadingRate, setIsLoadingRate] = useState<boolean>(false);
  const [rateError, setRateError] = useState<string | null>(null);

  const [renewalType, setRenewalType] = useState<RenewalType>(
    "PRINCIPAL_AND_INTEREST",
  );
  const [weekendWarning, setWeekendWarning] = useState<string | null>(null);

  // Parametre State'leri
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [timeProductId, setTimeProductId] = useState<number | null>(null);
  const [rules, setRules] = useState<ProductCurrency[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Dekont Modalı State'leri
  const [openReceiptModal, setOpenReceiptModal] = useState<boolean>(false);
  const [selectedReceipt, setSelectedReceipt] = useState<IReceiptData | null>(
    null,
  );
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // 1. URL'den customerId gelmişse müşteriyi çek
  useEffect(() => {
    const customerIdParam = searchParams.get("customerId");
    if (customerIdParam) {
      const fetchCustomer = async () => {
        try {
          const res = await api.get<{ success: boolean; data: Customer[] }>(
            "/customers",
          );
          const found = (res.data.data || []).find(
            (c) => c.id === Number(customerIdParam),
          );
          if (found) setSelectedCustomer(found);
        } catch (err) {
          console.error("Müşteri yüklenemedi:", err);
        }
      };
      fetchCustomer();
    }
  }, [searchParams]);

  // 2. Parametreleri Yükle (Vadeli Ürün & Döviz Kuralları)
  useEffect(() => {
    const fetchParameters = async () => {
      try {
        const res = await api.get<{
          success: boolean;
          data: {
            products: Product[];
            currencies: Currency[];
            productCurrencies: ProductCurrency[];
          };
        }>("/accounts/parameters");

        const timeProd = res.data.data.products.find((p) => p.type === "TIME");
        if (timeProd) setTimeProductId(timeProd.id);

        setCurrencies(res.data.data.currencies);
        setRules(res.data.data.productCurrencies);

        if (res.data.data.currencies.length > 0) {
          setSelectedCurrencyId(res.data.data.currencies[0].id);
        }
      } catch (err) {
        console.error("Parametreler alınamadı:", err);
      }
    };
    fetchParameters();
  }, []);

  // Müşteri / Döviz değiştikçe hesap adını güncelle
  useEffect(() => {
    if (selectedCustomer && selectedCurrencyId) {
      const curr = currencies.find((c) => c.id === selectedCurrencyId);
      if (curr) {
        setAccountName(
          `${selectedCustomer.firstName} Vadeli ${curr.code} Hesabı`,
        );
      }
    }
  }, [selectedCustomer, selectedCurrencyId, currencies]);

  // 3. Veritabanından Dinamik Faiz Oranını Çeken useEffect
  useEffect(() => {
    const days = Number(maturityDays);
    const amount = Number(initialAmount);

    if (selectedCurrencyId && days > 0 && amount > 0) {
      setIsLoadingRate(true);
      setRateError(null);

      api
        .get(`/accounts/interest-rate-preview`, {
          params: {
            currencyId: selectedCurrencyId,
            termDays: days,
            amount: amount,
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
              "Bu tutar ve vade aralığı için tanımlı faiz oranı bulunamadı.",
          );
        })
        .finally(() => {
          setIsLoadingRate(false);
        });
    } else {
      setInterestRate("");
      setRateError(null);
    }
  }, [selectedCurrencyId, maturityDays, initialAmount]);

  // Hafta sonu kontrolü
  const adjustToNextBusinessDay = (
    date: Date,
  ): { adjustedDate: Date; wasWeekend: boolean } => {
    const d = new Date(date);
    const day = d.getDay();
    let wasWeekend = false;

    if (day === 6) {
      d.setDate(d.getDate() + 2);
      wasWeekend = true;
    } else if (day === 0) {
      d.setDate(d.getDate() + 1);
      wasWeekend = true;
    }

    return { adjustedDate: d, wasWeekend };
  };

  const handleDaysChange = (daysVal: string) => {
    setMaturityDays(daysVal);
    const numDays = Number(daysVal);

    if (!isNaN(numDays) && numDays > 0 && startDate) {
      const start = new Date(startDate);
      start.setDate(start.getDate() + numDays);

      const { adjustedDate, wasWeekend } = adjustToNextBusinessDay(start);
      setEndDate(formatDateForInput(adjustedDate));

      if (wasWeekend) {
        setWeekendWarning(
          "Seçilen vade sonu hafta sonuna denk geldiği için ilk iş günü olan Pazartesi'ye ötelenmiştir.",
        );
      } else {
        setWeekendWarning(null);
      }

      const diffTime = adjustedDate.getTime() - new Date(startDate).getTime();
      const actualDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (actualDays !== numDays) {
        setMaturityDays(actualDays);
      }
    }
  };

  const handleEndDateChange = (endVal: string) => {
    if (!endVal) return;

    const rawDate = new Date(endVal);
    const { adjustedDate, wasWeekend } = adjustToNextBusinessDay(rawDate);

    setEndDate(formatDateForInput(adjustedDate));

    if (wasWeekend) {
      setWeekendWarning(
        "Seçilen tarih hafta sonuna denk geldiği için ilk iş günü olan Pazartesi'ye ötelenmiştir.",
      );
    } else {
      setWeekendWarning(null);
    }

    if (startDate) {
      const start = new Date(startDate);
      const diffTime = adjustedDate.getTime() - start.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 0) {
        setMaturityDays(diffDays);
      }
    }
  };

  // Tahmini Brüt Getiri
  const estimatedGrossInterest = useMemo(() => {
    const principal = Number(initialAmount || 0);
    const rate = Number(interestRate || 0);
    const days = Number(maturityDays || 0);
    if (principal > 0 && rate > 0 && days > 0) {
      return (principal * rate * days) / 36500;
    }
    return 0;
  }, [initialAmount, interestRate, maturityDays]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !timeProductId || !selectedCurrencyId) return;

    if (!sourceAccountId) {
      setNotification({
        type: "error",
        message:
          "Lütfen vadeli hesaba aktarılacak tutarın çekileceği kaynak vadesiz hesabı seçiniz.",
      });
      return;
    }

    if (renewalType !== "PRINCIPAL_AND_INTEREST" && !targetAccountId) {
      setNotification({
        type: "error",
        message:
          "Seçtiğiniz temdit türü için vade sonunda paranın aktarılacağı hedef vadesiz hesabı seçmelisiniz.",
      });
      return;
    }

    if (!interestRate || rateError) {
      setNotification({
        type: "error",
        message: "Geçerli bir faiz oranı olmadan vadeli hesap açılamaz.",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      setNotification(null);

      const res = await api.post("/accounts", {
        customerId: selectedCustomer.id,
        productId: timeProductId,
        currencyId: selectedCurrencyId,
        name: accountName.trim(),
        initialAmount: Number(initialAmount),
        sourceAccountId: sourceAccountId,
        targetAccountId:
          renewalType !== "PRINCIPAL_AND_INTEREST"
            ? targetAccountId
            : undefined,
        renewalType: renewalType,
        maturityDays: Number(maturityDays),
        maturityStart: new Date(startDate),
        maturityEnd: new Date(endDate),
      });

      setNotification({
        type: "success",
        message:
          "Vadeli hesap açılışı ve başlangıç virmanı başarıyla tamamlandı.",
      });

      const newAccountId = res.data.data?.id || res.data.id;
      if (newAccountId) {
        const receiptRes = await api.get(
          `/accounting?accountId=${newAccountId}`,
        );
        if (receiptRes.data.data?.length > 0) {
          setSelectedReceipt(receiptRes.data.data[0]);
          setOpenReceiptModal(true);
        }
      }

      setInitialAmount("");
    } catch (err: any) {
      setNotification({
        type: "error",
        message: err.response?.data?.message || "Vadeli hesap açılamadı.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
        Vadeli Hesap Açılış İşlemleri
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Müşterinin vadesiz hesabından kaynak tutar aktararak dinamik faiz ve
        vade kurallarıyla vadeli mevduat hesabı tanımlayabilirsiniz.
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

      {/* 1. MÜŞTERİ SEÇİM KARTI */}
      <CustomerSearchCard
        selectedCustomer={selectedCustomer}
        onSelectCustomer={(c) => {
          setSelectedCustomer(c);
          setSourceAccountId(null);
          setTargetAccountId(null);
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
            <form onSubmit={handleSubmit}>
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
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    required
                    fullWidth
                    size="small"
                  />

                  <FormControl fullWidth size="small">
                    <InputLabel>Para Birimi</InputLabel>
                    <Select
                      value={selectedCurrencyId}
                      label="Para Birimi"
                      onChange={(e) => {
                        setSelectedCurrencyId(Number(e.target.value));
                        setSourceAccountId(null);
                        setTargetAccountId(null);
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
                </Box>

                {/* 2. SATIR: VADE GÜNÜ & TARİHLER */}
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
                    fullWidth
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
                    fullWidth
                    size="small"
                    slotProps={{ inputLabel: { shrink: true } }}
                  />

                  <TextField
                    label="Vade Bitiş Tarihi"
                    type="date"
                    value={endDate}
                    onChange={(e) => handleEndDateChange(e.target.value)}
                    required
                    fullWidth
                    size="small"
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </Box>

                {weekendWarning && (
                  <Alert severity="warning" sx={{ py: 0.5 }}>
                    {weekendWarning}
                  </Alert>
                )}

                {/* 3. SATIR: TUTAR, KİLİTLİ FAİZ ORANI & TEMDİT */}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1.2fr 1fr 1.5fr",
                    gap: 2,
                  }}
                >
                  <TextField
                    label="Açılış Tutarı (Anapara)"
                    type="number"
                    value={initialAmount}
                    onChange={(e) => setInitialAmount(e.target.value)}
                    required
                    fullWidth
                    size="small"
                    slotProps={{ htmlInput: { min: 0.01, step: "0.01" } }}
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
                    error={!!rateError}
                    helperText={
                      rateError ||
                      "Sistem tarafından tablodan otomatik getirilir."
                    }
                    fullWidth
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

                {/* 4. SATIR: KAYNAK VE HEDEF HESAPLAR */}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns:
                      renewalType !== "PRINCIPAL_AND_INTEREST"
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
                      selectedAccountId={sourceAccountId}
                      filterOnlyActive={true}
                      includeClosed={false}
                      onChange={(acc) =>
                        setSourceAccountId(acc ? acc.id : null)
                      }
                      label="Kaynak Vadesiz Hesabı Seçiniz"
                    />
                  </Box>

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
                        Vade Sonu Paranın Aktarılacağı Hedef Vadesiz Hesap:
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
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
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
                        {currencies.find((c) => c.id === selectedCurrencyId)
                          ?.code || "TRY"}
                      </Typography>
                    </Box>
                  </Box>

                  <Typography
                    variant="caption"
                    sx={{ color: "#64748b", textAlign: "right" }}
                  >
                    Vade: <strong>{startDate}</strong> ➔{" "}
                    <strong>{endDate}</strong> ({maturityDays} Gün)
                  </Typography>
                </Paper>

                <Divider />

                {/* ONAY BUTONU */}
                <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<AccessTimeIcon />}
                    disabled={
                      isSubmitting ||
                      isLoadingRate ||
                      !interestRate ||
                      Boolean(rateError)
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
  );
};
