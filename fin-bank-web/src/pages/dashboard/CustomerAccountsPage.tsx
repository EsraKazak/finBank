import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Stack,
  CircularProgress,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { AgGridReact } from "ag-grid-react";
import { themeAlpine, type ColDef } from "ag-grid-community";
import api from "../../services/api";
import type { Customer } from "../../types/customer.types";
import { CustomerInfoCard } from "../../components/common/CustomerInfoCard"; // Bileşenin tam yolu

export const CustomerAccountsPage: React.FC = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Yönlendirmeden (state) gelen müşteri varsa hemen kullan
  const [customer, setCustomer] = useState<Customer | null>(
    location.state?.customer || null,
  );
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 1. Müşterinin tüm hesaplarını çek
        const accRes = await api.get(
          `/accounts/customer/${customerId}?includeClosed=true`,
        );
        const accountList = accRes.data?.data || accRes.data || [];
        setAccounts(Array.isArray(accountList) ? accountList : []);

        // 2. Müşteri bilgisi state'ten gelmediyse hesap nesnesinden veya /customers'tan bul
        if (!customer) {
          if (accountList.length > 0 && accountList[0].customer) {
            setCustomer(accountList[0].customer);
          } else {
            const custRes = await api.get("/customers", {
              params: { search: customerId },
            });
            const list = custRes.data?.data || custRes.data || [];
            const found = list.find(
              (c: any) => String(c.id) === String(customerId),
            );
            if (found) setCustomer(found);
          }
        }
      } catch (err) {
        console.error("Hesaplar yüklenemedi:", err);
      } finally {
        setLoading(false);
      }
    };

    if (customerId) fetchData();
  }, [customerId]);

  const columnDefs = useMemo<ColDef[]>(
    () => [
      {
        headerName: "Hesap No",
        field: "accountNumber",
        minWidth: 130,
        cellStyle: { fontWeight: 600 },
      },
      {
        headerName: "IBAN",
        field: "iban",
        minWidth: 260,
        valueGetter: (p) => p.data?.iban || "-",
      },
      {
        headerName: "Tür",
        width: 130,
        cellRenderer: (params: any) => {
          // Hesapta maturityDays/interestRate varsa veya product.type "TIME" ise vadelidir
          const isTime =
            params.data?.product?.type === "TIME" ||
            params.data?.maturityDays !== null ||
            params.data?.interestRate !== null;

          return (
            <Chip
              label={isTime ? "Vadeli" : "Vadesiz"}
              size="small"
              color={isTime ? "secondary" : "primary"}
              variant="outlined"
            />
          );
        },
      },
      {
        headerName: "Para Birimi",
        width: 120,
        valueGetter: (p) => p.data?.currency?.code || "TRY",
      },
      {
        headerName: "Bakiye",
        field: "balance",
        width: 150,
        valueFormatter: (p) =>
          Number(p.value || 0).toLocaleString("tr-TR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }),
        cellStyle: { fontWeight: 600 },
      },
      {
        headerName: "Vade / Faiz",
        width: 180,
        valueGetter: (p) => {
          // Veriler doğrudan hesabın kendi kolonlarında duruyor
          const rate = p.data?.interestRate;
          const days = p.data?.maturityDays;

          if (
            rate !== null &&
            rate !== undefined &&
            days !== null &&
            days !== undefined
          ) {
            return `%${rate} / ${days} Gün`;
          }
          if (rate !== null && rate !== undefined) {
            return `%${rate}`;
          }
          return "-";
        },
      },
      {
        headerName: "Temdit (Yenileme)",
        width: 160,
        valueGetter: (p) => {
          if (!p.data?.renewalType) return "-";
          const map: Record<string, string> = {
            CAPITAL_ONLY: "Sadece Anapara",
            CAPITAL_AND_INTEREST: "Anapara + Faiz",
            CLOSE_AT_MATURITY: "Vade Sonu Kapat",
          };
          return map[p.data.renewalType] || p.data.renewalType;
        },
      },
      {
        headerName: "Şube",
        field: "branch",
        width: 160,
        valueGetter: (params) => params.data?.branch?.name || "-",
      },
      {
        headerName: "Durum",
        field: "status",
        width: 110,
        cellRenderer: (params: any) => (
          <Chip
            label={params.value === "ACTIVE" ? "Aktif" : "Kapalı"}
            size="small"
            color={params.value === "ACTIVE" ? "success" : "default"}
          />
        ),
      },
    ],
    [],
  );

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Üst Bar */}
      <Stack
        direction="row"
        sx={{ justifyContent: "space-between", alignItems: "center", mb: 2 }}
      >
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/dashboard/customers")}
          variant="outlined"
          size="small"
        >
          Müşteri Listesine Dön
        </Button>

        <Typography
          variant="body2"
          sx={{ color: "text.secondary", fontWeight: 600 }}
        >
          Toplam Hesap Sayısı:{" "}
          <Typography
            component="span"
            sx={{ fontWeight: 800, color: "primary.main" }}
          >
            {accounts.length} Adet
          </Typography>
        </Typography>
      </Stack>

      {/* Müşteri Bilgi Kartı Bileşeni */}
      {customer && <CustomerInfoCard customer={customer} />}

      {/* AG Grid Tablosu */}
      <Card sx={{ borderRadius: 2, overflow: "hidden" }}>
        <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
          <div style={{ height: 600, width: "100%" }}>
            <AgGridReact
              theme={themeAlpine}
              rowData={accounts || []}
              columnDefs={columnDefs}
              pagination={true}
              paginationPageSize={10}
              paginationPageSizeSelector={[10, 20, 50]}
              rowHeight={48}
            />
          </div>
        </CardContent>
      </Card>
    </Box>
  );
};
