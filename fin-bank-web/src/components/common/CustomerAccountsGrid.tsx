import React, { useState, useEffect, useMemo } from "react";
import { Box, Card, Typography, Chip, Button, Tooltip } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import { AgGridReact } from "ag-grid-react";
import type { ColDef } from "ag-grid-community";
import api from "../../services/api";
import type { Account } from "../../types/account.types";

interface CustomerAccountsGridProps {
  customerId: number;
  selectedAccountId?: number | null;
  onSelectAccount: (account: Account) => void;
  refreshTrigger?: number; // Bakiye değiştiğinde tabloyu anında yenilemek için
}

export const CustomerAccountsGrid: React.FC<CustomerAccountsGridProps> = ({
  customerId,
  selectedAccountId,
  onSelectAccount,
  refreshTrigger = 0,
}) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        setLoading(true);
        const res = await api.get<{ success: boolean; data: Account[] }>(
          `/accounts/customer/${customerId}`,
        );
        const demandAccounts = (res.data.data || []).filter(
          (a) => a.product?.type === "DEMAND" && a.status !== "CLOSED",
        );
        setAccounts(demandAccounts);

        // Eğer seçili hesap varsa güncel halini üst sayfaya tekrar bildir
        if (selectedAccountId) {
          const updated = demandAccounts.find(
            (a) => a.id === selectedAccountId,
          );
          if (updated) onSelectAccount(updated);
        } else if (demandAccounts.length > 0) {
          const firstActive = demandAccounts.find((a) => a.status === "ACTIVE");
          if (firstActive) onSelectAccount(firstActive);
        }
      } catch (err) {
        console.error("Hesaplar alınamadı:", err);
      } finally {
        setLoading(false);
      }
    };

    if (customerId) {
      fetchAccounts();
    }
  }, [customerId, refreshTrigger]);

  const columnDefs = useMemo<ColDef<Account>[]>(
    () => [
      {
        headerName: "Ek No",
        field: "accountNumber",
        width: 100,
        cellRenderer: (params: any) => (
          <Typography sx={{ fontWeight: 700, fontSize: "0.875rem" }}>
            {params.value}
          </Typography>
        ),
      },
      {
        headerName: "Hesap Adı",
        field: "name",
        flex: 1.2,
        cellRenderer: (params: any) => (
          <Typography sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
            {params.value}
          </Typography>
        ),
      },
      {
        headerName: "IBAN",
        field: "iban",
        flex: 1.6,
        cellRenderer: (params: any) => (
          <Typography sx={{ fontFamily: "monospace", fontSize: 13 }}>
            {params.value}
          </Typography>
        ),
      },
      {
        headerName: "Kullanılabilir Bakiye",
        field: "balance",
        flex: 1.2,
        cellRenderer: (params: any) => (
          <Typography
            sx={{ fontWeight: 800, color: "#16a34a", fontSize: "0.9rem" }}
          >
            {Number(params.value).toLocaleString("tr-TR", {
              minimumFractionDigits: 2,
            })}{" "}
            {params.data?.currency?.code || "TRY"}
          </Typography>
        ),
      },
      {
        headerName: "Durum",
        field: "status",
        width: 110,
        cellRenderer: (params: any) => (
          <Chip
            label={params.value === "ACTIVE" ? "Aktif" : "Bloke"}
            color={params.value === "ACTIVE" ? "success" : "warning"}
            size="small"
            sx={{ fontWeight: 600, fontSize: 11 }}
          />
        ),
      },
      {
        headerName: "Seçim",
        field: "id",
        width: 130,
        sortable: false,
        filter: false,
        cellClass: "ag-cell-center",
        headerClass: "ag-header-cell-center",
        cellRenderer: (params: any) => {
          const acc = params.data as Account;
          const isSelected = selectedAccountId === acc.id;
          const isBlocked = acc.status === "BLOCKED";

          return (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
              }}
            >
              <Tooltip
                title={
                  isBlocked ? "Hesap blokeli olduğu için işlem yapılamaz" : ""
                }
              >
                <span>
                  <Button
                    size="small"
                    variant={isSelected ? "contained" : "outlined"}
                    color={isSelected ? "primary" : "inherit"}
                    disabled={isBlocked}
                    startIcon={
                      isSelected ? (
                        <CheckCircleIcon sx={{ fontSize: 16 }} />
                      ) : (
                        <RadioButtonUncheckedIcon sx={{ fontSize: 16 }} />
                      )
                    }
                    onClick={() => onSelectAccount(acc)}
                    sx={{
                      textTransform: "none",
                      borderRadius: 1.5,
                      fontWeight: 700,
                      fontSize: 12,
                      py: 0.3,
                    }}
                  >
                    {isSelected ? "Seçildi" : "Hesabı Seç"}
                  </Button>
                </span>
              </Tooltip>
            </Box>
          );
        },
      },
    ],
    [selectedAccountId, onSelectAccount],
  );

  return (
    <Card
      sx={{
        borderRadius: 3,
        boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
        border: "1px solid #e2e8f0",
        mb: 3,
        overflow: "hidden",
      }}
    >
      <Box sx={{ p: 2, bgcolor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
        <Typography
          variant="subtitle2"
          sx={{ fontWeight: 700, color: "#334155" }}
        >
          Müşteriye Ait Vadesiz Hesaplar (İşlem Yapılacak Hesabı Seçiniz)
        </Typography>
      </Box>

      <div className="ag-theme-alpine" style={{ height: 240, width: "100%" }}>
        <AgGridReact
          rowData={accounts}
          columnDefs={columnDefs}
          loading={loading}
          animateRows={true}
          overlayNoRowsTemplate="<span>Müşteriye ait aktif vadesiz hesap bulunamadı.</span>"
        />
      </div>
    </Card>
  );
};
