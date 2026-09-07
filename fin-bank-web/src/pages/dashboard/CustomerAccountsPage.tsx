import React, { useState, useEffect, useMemo } from "react";
import moment from "moment";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Divider,
  Chip,
  Paper,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import VisibilityIcon from "@mui/icons-material/Visibility";

import api, { getCustomerAccounts } from "../../services/api";
import type { Customer } from "../../types/customer.types";
import type { Account } from "../../types/account.types";
import { CustomerSearchCard } from "../../components/common/CustomerSearchCard";

export const CustomerAccountsPage: React.FC = () => {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(
    null,
  );
  const [accountDetails, setAccountDetails] = useState<any>(null);
  const [loadingList, setLoadingList] = useState<boolean>(false);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Müşteri seçildiğinde TÜM hesaplarını getir
  useEffect(() => {
    if (!selectedCustomer) {
      setAccounts([]);
      setSelectedAccountId(null);
      setAccountDetails(null);
      return;
    }

    setLoadingList(true);
    getCustomerAccounts(selectedCustomer.id)
      .then((data: Account[]) => {
        setAccounts(data || []);
        // Varsayılan olarak ilk hesabı seç
        if (data && data.length > 0) {
          setSelectedAccountId(data[0].id);
        } else {
          setSelectedAccountId(null);
        }
      })
      .catch((err) => {
        console.error("Hesaplar alınamadı:", err);
        setAccounts([]);
      })
      .finally(() => setLoadingList(false));
  }, [selectedCustomer]);

  // Seçilen hesabın detaylarını getir
  useEffect(() => {
    if (!selectedAccountId) {
      setAccountDetails(null);
      return;
    }

    setLoadingDetails(true);
    api
      .get(`/accounts/${selectedAccountId}`)
      .then((res) => {
        setAccountDetails(res.data.data);
      })
      .catch((err) => {
        console.error("Hesap detayı alınamadı:", err);
        setAccountDetails(null);
      })
      .finally(() => setLoadingDetails(false));
  }, [selectedAccountId]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const estimatedGrossInterest = useMemo(() => {
    if (!accountDetails || accountDetails.product?.type !== "TIME") return 0;
    const principal = Number(accountDetails.balance || 0);
    const rate = Number(accountDetails.interestRate || 0);
    const days = Number(accountDetails.maturityDays || 0);
    return principal > 0 && rate > 0 && days > 0
      ? (principal * rate * days) / 36500
      : 0;
  }, [accountDetails]);

  const getRenewalLabel = (type?: string) => {
    switch (type) {
      case "PRINCIPAL_AND_INTEREST":
        return "Anapara + Faiz Yenilensin";
      case "PRINCIPAL_ONLY":
        return "Sadece Anapara Yenilensin (Faiz Aktar)";
      case "CLOSE":
        return "Vade Sonunda Otomatik Kapat";
      default:
        return "Belirtilmemiş";
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
        Müşteri Hesapları ve Hesap Dökümü
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Müşteriye ait tüm hesapları listeleyebilir, satıra tıklayarak detaylı
        dökümünü inceleyebilirsiniz.
      </Typography>

      {/* 1. MÜŞTERİ SEÇİM ALANI */}
      <CustomerSearchCard
        selectedCustomer={selectedCustomer}
        onSelectCustomer={(c) => {
          setSelectedCustomer(c);
        }}
      />

      {selectedCustomer && (
        <Box sx={{ mt: 3, display: "flex", flexDirection: "column", gap: 3 }}>
          {/* 2. TÜM HESAPLAR LİSTESİ (TABLO) */}
          <Card
            sx={{ borderRadius: 3, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 700, mb: 2, color: "#1e293b" }}
              >
                Müşterinin Tüm Hesapları ({accounts.length})
              </Typography>

              {loadingList ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <CircularProgress size={32} />
                </Box>
              ) : accounts.length === 0 ? (
                <Alert severity="info">
                  Müşteriye ait kayıtlı hesap bulunamadı.
                </Alert>
              ) : (
                <TableContainer
                  component={Paper}
                  variant="outlined"
                  elevation={0}
                >
                  <Table size="small">
                    <TableHead sx={{ bgcolor: "#f8fafc" }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>
                          Hesap Adı
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>IBAN</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>
                          Hesap Türü
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="right">
                          Bakiye
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="center">
                          Durum
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="center">
                          Seç
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {accounts.map((acc) => {
                        const isSelected = acc.id === selectedAccountId;
                        return (
                          <TableRow
                            key={acc.id}
                            hover
                            onClick={() => setSelectedAccountId(acc.id)}
                            sx={{
                              cursor: "pointer",
                              bgcolor: isSelected
                                ? "rgba(2, 132, 199, 0.08)"
                                : "inherit",
                            }}
                          >
                            <TableCell
                              sx={{ fontWeight: isSelected ? 700 : 500 }}
                            >
                              {acc.name}
                            </TableCell>
                            <TableCell sx={{ fontFamily: "monospace" }}>
                              {acc.iban}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={
                                  acc.product?.type === "TIME"
                                    ? "Vadeli"
                                    : "Vadesiz"
                                }
                                size="small"
                                color={
                                  acc.product?.type === "TIME"
                                    ? "primary"
                                    : "default"
                                }
                              />
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>
                              {Number(acc.balance).toLocaleString("tr-TR", {
                                minimumFractionDigits: 2,
                              })}{" "}
                              {acc.currency?.code}
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={
                                  acc.status === "ACTIVE"
                                    ? "Aktif"
                                    : acc.status === "BLOCKED"
                                      ? "Blokeli"
                                      : "Kapalı"
                                }
                                size="small"
                                color={
                                  acc.status === "ACTIVE" ? "success" : "error"
                                }
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell align="center">
                              <IconButton
                                size="small"
                                color={isSelected ? "primary" : "default"}
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>

          {/* 3. SEÇİLEN HESABIN DETAY DÖKÜMÜ */}
          {loadingDetails && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {!loadingDetails && accountDetails && (
            <Card
              sx={{ borderRadius: 3, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}
            >
              <CardContent sx={{ p: 4 }}>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700, mb: 3, color: "#0f172a" }}
                >
                  Hesap Dökümü: {accountDetails.name} ({accountDetails.iban})
                </Typography>

                {/* Üst Kartlar */}
                <Grid container spacing={3} sx={{ mb: 3 }}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Paper
                      elevation={0}
                      variant="outlined"
                      sx={{
                        p: 3,
                        borderRadius: 3,
                        bgcolor: "#f8fafc",
                        display: "flex",
                        alignItems: "center",
                        gap: 2.5,
                      }}
                    >
                      <AccountBalanceWalletIcon
                        color="primary"
                        sx={{ fontSize: 44 }}
                      />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Mevcut Bakiye
                        </Typography>
                        <Typography
                          variant="h4"
                          sx={{ fontWeight: 800, color: "#0f172a" }}
                        >
                          {Number(accountDetails.balance).toLocaleString(
                            "tr-TR",
                            { minimumFractionDigits: 2 },
                          )}{" "}
                          {accountDetails.currency?.code}
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Paper
                      elevation={0}
                      variant="outlined"
                      sx={{
                        p: 3,
                        borderRadius: 3,
                        bgcolor: "#f8fafc",
                        display: "flex",
                        alignItems: "center",
                        gap: 2.5,
                      }}
                    >
                      <AccountBalanceIcon
                        sx={{ fontSize: 44, color: "#64748b" }}
                      />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Hesap Türü & Durumu
                        </Typography>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mt: 0.5,
                          }}
                        >
                          <Chip
                            label={
                              accountDetails.product?.type === "TIME"
                                ? "Vadeli Mevduat"
                                : "Vadesiz Mevduat"
                            }
                            color={
                              accountDetails.product?.type === "TIME"
                                ? "primary"
                                : "default"
                            }
                            size="small"
                          />
                          <Chip
                            label={
                              accountDetails.status === "ACTIVE"
                                ? "Aktif"
                                : accountDetails.status === "BLOCKED"
                                  ? "Blokeli"
                                  : "Kapalı"
                            }
                            color={
                              accountDetails.status === "ACTIVE"
                                ? "success"
                                : "error"
                            }
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>

                {/* Parametreler */}
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Paper
                      elevation={0}
                      variant="outlined"
                      sx={{ p: 3, borderRadius: 3, height: "100%" }}
                    >
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: 700,
                          mb: 2,
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        <InfoOutlinedIcon fontSize="small" color="primary" />{" "}
                        Genel Bilgiler
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 2,
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            Hesap No:
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {accountDetails.accountNumber}
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            IBAN:
                          </Typography>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600, fontFamily: "monospace" }}
                            >
                              {accountDetails.iban}
                            </Typography>
                            <Tooltip title={copied ? "Kopyalandı!" : "Kopyala"}>
                              <IconButton
                                size="small"
                                onClick={() =>
                                  copyToClipboard(accountDetails.iban)
                                }
                              >
                                <ContentCopyIcon fontSize="inherit" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            Şube:
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {accountDetails.branch?.name || "Merkez Şube"}
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            Açılış Tarihi:
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {moment(accountDetails.createdAt).format(
                              "DD.MM.YYYY HH:mm",
                            )}
                          </Typography>
                        </Box>

                        {/* Hesap Kapalıysa Kapanış Tarihi */}
                        {accountDetails.status === "CLOSED" && (
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <Typography
                              variant="body2"
                              color="error.main"
                              sx={{ fontWeight: 600 }}
                            >
                              Kapanış Tarihi:
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 700, color: "error.main" }}
                            >
                              {moment(accountDetails.updatedAt).format(
                                "DD.MM.YYYY HH:mm",
                              )}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Paper>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Paper
                      elevation={0}
                      variant="outlined"
                      sx={{ p: 3, borderRadius: 3, height: "100%" }}
                    >
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: 700,
                          mb: 2,
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        <CalendarMonthIcon fontSize="small" color="primary" />{" "}
                        {accountDetails.product?.type === "TIME"
                          ? "Vade & Faiz Koşulları"
                          : "Mevduat Özellikleri"}
                      </Typography>
                      <Divider sx={{ mb: 2 }} />

                      {accountDetails.product?.type === "TIME" ? (
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 2,
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography variant="body2" color="text.secondary">
                              Faiz Oranı:
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 700, color: "#0284c7" }}
                            >
                              %{accountDetails.interestRate}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography variant="body2" color="text.secondary">
                              Vade Süresi:
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600 }}
                            >
                              {accountDetails.maturityDays} Gün
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography variant="body2" color="text.secondary">
                              Vade Başlangıç / Bitiş:
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600 }}
                            >
                              {moment(accountDetails.maturityStart).format(
                                "DD.MM.YYYY",
                              )}{" "}
                              ➔{" "}
                              {moment(accountDetails.maturityEnd).format(
                                "DD.MM.YYYY",
                              )}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography variant="body2" color="text.secondary">
                              Temdit Türü:
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600 }}
                            >
                              {getRenewalLabel(accountDetails.renewalType)}
                            </Typography>
                          </Box>
                          {accountDetails.targetAccount && (
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Aktarılacak Hedef Hesap:
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 600 }}
                              >
                                {accountDetails.targetAccount.accountNumber}
                              </Typography>
                            </Box>
                          )}
                          <Paper
                            variant="outlined"
                            sx={{
                              p: 2,
                              bgcolor: "#f0fdf4",
                              borderColor: "#bbf7d0",
                              mt: 1,
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <TrendingUpIcon color="success" />
                              <Box>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Vade Sonu Tahmini Brüt Getiri
                                </Typography>
                                <Typography
                                  variant="subtitle1"
                                  sx={{ fontWeight: 800, color: "#16a34a" }}
                                >
                                  {estimatedGrossInterest.toLocaleString(
                                    "tr-TR",
                                    { minimumFractionDigits: 2 },
                                  )}{" "}
                                  {accountDetails.currency?.code}
                                </Typography>
                              </Box>
                            </Box>
                          </Paper>
                        </Box>
                      ) : (
                        <Alert severity="info">
                          Bu hesap standart vadesiz mevduat hesabıdır. Faiz veya
                          vade bitiş tarihi işletilmemektedir.
                        </Alert>
                      )}
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}
        </Box>
      )}
    </Box>
  );
};
