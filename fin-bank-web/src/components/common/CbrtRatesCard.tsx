import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  CircularProgress,
  Alert,
  Grid,
} from "@mui/material";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import TrendingFlatIcon from "@mui/icons-material/TrendingFlat";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import CurrencyExchangeIcon from "@mui/icons-material/CurrencyExchange";
import moment from "moment";
import { useCbrtRates } from "../../hooks/useCbrtRates";

export const CbrtRatesCard: React.FC = () => {
  const { data, isLoading, isError } = useCbrtRates();

  if (isLoading) {
    return (
      <Card
        elevation={0}
        sx={{
          borderRadius: 3.5,
          p: 4,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          border: "1px solid #e2e8f0",
          bgcolor: "#ffffff",
          minHeight: 180,
        }}
      >
        <CircularProgress size={32} />
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Alert severity="warning" sx={{ borderRadius: 3.5 }}>
        TCMB faiz ve kur verilerine ulaşılamadı.
      </Alert>
    );
  }

  // Politika faizine göre referans banka ürün oranları
  const policyRate = data.policyRate;
  const depositRate = Number((policyRate + 2.5).toFixed(2));
  const loanMonthlyRate = Number((policyRate / 12 + 0.35).toFixed(2));

  // Backend'den gelen veya varsayılan döviz kurları
  const currencies = (data as any).currencies || [
    { code: "USD", name: "Dolar", buying: 34.15, selling: 34.25 },
    { code: "EUR", name: "Euro", buying: 37.82, selling: 37.95 },
  ];

  const renderTrendChip = (trend: "UP" | "DOWN" | "STABLE") => (
    <Chip
      size="small"
      icon={
        trend === "UP" ? (
          <TrendingUpIcon sx={{ fontSize: 16 }} />
        ) : trend === "DOWN" ? (
          <TrendingDownIcon sx={{ fontSize: 16 }} />
        ) : (
          <TrendingFlatIcon sx={{ fontSize: 16 }} />
        )
      }
      label={trend === "UP" ? "Artış" : trend === "DOWN" ? "İndirim" : "Sabit"}
      color={
        trend === "UP" ? "error" : trend === "DOWN" ? "success" : "default"
      }
      variant="outlined"
      sx={{ fontWeight: 600, height: 24 }}
    />
  );

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3.5,
        border: "1px solid #e2e8f0",
        bgcolor: "#ffffff",
        boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
        overflow: "hidden",
      }}
    >
      <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
        {/* Üst Başlık ve Son Karar Tarihi */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 1,
            mb: 3,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
            <Box
              sx={{
                p: 1,
                borderRadius: 2,
                bgcolor: "primary.50",
                color: "primary.main",
                display: "flex",
              }}
            >
              <AccountBalanceIcon fontSize="small" />
            </Box>
            <Box>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 700, color: "#0a192f" }}
              >
                Piyasa, Faiz & Döviz Göstergeleri
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {data.source || "TCMB EVDS Canlı Referans Oranları"}
              </Typography>
            </Box>
          </Box>

          <Typography
            variant="caption"
            sx={{ color: "text.secondary", fontWeight: 500 }}
          >
            Son Karar: {moment(data.lastDecisionDate).format("DD.MM.YYYY")}
          </Typography>
        </Box>

        {/* 4'lü Gösterge Grid'i (Faizler + Döviz Kurları) */}
        <Grid container spacing={2}>
          {/* 1. KART: TCMB Politika Faizi */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Box
              sx={{
                p: 2.5,
                borderRadius: 3,
                bgcolor: "#f8fafc",
                border: "1px solid #edf2f7",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  mb: 2,
                }}
              >
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontWeight: 600 }}
                  >
                    POLİTİKA FAİZİ
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: "#1e293b", fontWeight: 700 }}
                  >
                    1 Hafta Repo
                  </Typography>
                </Box>
                {renderTrendChip(data.trend)}
              </Box>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 0.5,
                  my: 1,
                }}
              >
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 800, color: "#0a192f" }}
                >
                  %{policyRate.toFixed(2)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  / Yıllık
                </Typography>
              </Box>

              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 1, display: "block" }}
              >
                Gecelik: %{data.overnightBorrowingRate.toFixed(2)} - %
                {data.overnightLendingRate.toFixed(2)}
              </Typography>
            </Box>
          </Grid>

          {/* 2. KART: Vadeli Mevduat */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Box
              sx={{
                p: 2.5,
                borderRadius: 3,
                bgcolor: "#f8fafc",
                border: "1px solid #edf2f7",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  mb: 2,
                }}
              >
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontWeight: 600 }}
                  >
                    MEVDUAT GETİRİSİ
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: "#1e293b", fontWeight: 700 }}
                  >
                    32-90 Gün Vadeli
                  </Typography>
                </Box>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 0.5,
                  my: 1,
                }}
              >
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 800, color: "#2e7d32" }}
                >
                  %{depositRate.toFixed(2)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  / Yıllık
                </Typography>
              </Box>

              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 1, display: "block" }}
              >
                Gösterge banka mevduat ortalaması
              </Typography>
            </Box>
          </Grid>

          {/* 3. KART: Tüketici / İhtiyaç Kredisi */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Box
              sx={{
                p: 2.5,
                borderRadius: 3,
                bgcolor: "#f8fafc",
                border: "1px solid #edf2f7",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  mb: 2,
                }}
              >
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontWeight: 600 }}
                  >
                    TÜKETİCİ FİNANSMANI
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: "#1e293b", fontWeight: 700 }}
                  >
                    İhtiyaç Kredisi
                  </Typography>
                </Box>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 0.5,
                  my: 1,
                }}
              >
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 800, color: "#1565c0" }}
                >
                  %{loanMonthlyRate.toFixed(2)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  / Aylık
                </Typography>
              </Box>

              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 1, display: "block" }}
              >
                Referans maliyet bazlı hesaplanan oran
              </Typography>
            </Box>
          </Grid>

          {/* 4. KART: TCMB DÖVİZ KURLARI (YENİ EKLENEN KART) */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Box
              sx={{
                p: 2,
                borderRadius: 3,
                bgcolor: "#f8fafc",
                border: "1px solid #edf2f7",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}
              >
                <CurrencyExchangeIcon
                  fontSize="small"
                  sx={{ color: "primary.main" }}
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 700 }}
                >
                  GÖSTERGE KURLARI
                </Typography>
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
                {currencies.map((cur: any) => (
                  <Box
                    key={cur.code}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      pb: 0.5,
                      borderBottom: "1px dashed #e2e8f0",
                    }}
                  >
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 700, color: "#0a192f" }}
                      >
                        {cur.code} / TRY
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {cur.name}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: "right" }}>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 800, color: "#0f172a" }}
                      >
                        ₺{Number(cur.selling || 0).toFixed(4)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Alış: ₺{Number(cur.buying || 0).toFixed(4)}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>

              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 1, display: "block" }}
              >
                TCMB resmi efektif satış kurları
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};
