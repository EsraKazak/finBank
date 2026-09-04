import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  TextField,
  Popover,
  InputAdornment,
  CircularProgress,
  Typography,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { AgGridReact } from "ag-grid-react";
import type { ColDef, RowClickedEvent, RowStyle } from "ag-grid-community";
import api from "../../services/api";
import type { Account } from "../../types/account.types";
import { themeAlpine } from "ag-grid-community";

export interface CustomerAccountSelectProps {
  customerId: number;
  value?: Account | null;
  selectedAccountId?: number | null;
  excludeAccountId?: number | null;
  onChange: (account: Account | null) => void;
  label?: string;
  disabled?: boolean;
  includeClosed?: boolean;
  currencyId?: number | null;
  filterOnlyActive?: boolean;
  refreshTrigger?: number;
  allowedProductTypes?: Array<"DEMAND" | "TIME" | string>;
}

export const CustomerAccountSelect: React.FC<CustomerAccountSelectProps> = ({
  customerId,
  value,
  currencyId,
  selectedAccountId,
  excludeAccountId,
  onChange,
  label = "Hesap Seçiniz",
  disabled = false,
  includeClosed = false,
  filterOnlyActive = true,
  refreshTrigger = 0,
  allowedProductTypes = ["DEMAND"],
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const fetchAccounts = async () => {
    if (!customerId) {
      setAccounts([]);
      onChange(null);
      return;
    }

    try {
      setLoading(true);

      // Tek bir tip varsa direkt gönder, birden fazla ise virgülle ayırarak ilet
      const accountTypeParam =
        allowedProductTypes && allowedProductTypes.length === 1
          ? allowedProductTypes[0]
          : allowedProductTypes?.join(",");

      const res = await api.get<{ success: boolean; data: Account[] }>(
        `/accounts/customer/${customerId}`,
        {
          params: {
            ...(accountTypeParam && { accountType: accountTypeParam }),
          },
        },
      );

      let fetchedAccounts = res.data.data || [];

      // Sadece kapalı hesap filtresi (istenirse bu da backend'e taşınabilir)
      if (!includeClosed) {
        fetchedAccounts = fetchedAccounts.filter((a) => a.status !== "CLOSED");
      }

      setAccounts(fetchedAccounts);

      if (selectedAccountId && !value) {
        const matched = fetchedAccounts.find((a) => a.id === selectedAccountId);
        if (matched) onChange(matched);
      }
    } catch (err) {
      console.error("Hesaplar alınamadı:", err);
    } finally {
      setLoading(false);
    }
  };

  // Dizi değerlerini virgülle birleştirip stabil bir primitive string elde et
  const productTypesKey = allowedProductTypes?.join(",") || "ALL";

  useEffect(() => {
    fetchAccounts();
  }, [customerId, refreshTrigger, includeClosed, productTypesKey]);

  const displayAccounts = useMemo(() => {
    let result = accounts;
    if (excludeAccountId) {
      result = result.filter((a) => a.id !== excludeAccountId);
    }
    if (currencyId) {
      result = result.filter((a) => a.currencyId === currencyId); // <-- Para birimi filtrelemesi
    }
    return result;
  }, [accounts, excludeAccountId, currencyId]);
  const selectedAccount = useMemo(() => {
    if (value !== undefined) return value;
    return accounts.find((a) => a.id === selectedAccountId) || null;
  }, [value, selectedAccountId, accounts]);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    if (disabled || loading) return;
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const isOpen = Boolean(anchorEl);

  const columnDefs = useMemo<ColDef<Account>[]>(
    () => [
      {
        headerName: "Ek No",
        field: "accountNumber",
        width: isMobile ? 85 : 110,
        cellRenderer: (params: any) => (
          <Typography sx={{ fontWeight: 700, fontSize: "0.85rem" }}>
            {params.value}
          </Typography>
        ),
      },
      {
        headerName: "Hesap Adı",
        field: "name",
        minWidth: 140,
        flex: 1.2,
        cellRenderer: (params: any) => (
          <Typography sx={{ fontWeight: 600, fontSize: "0.85rem" }}>
            {params.value}
          </Typography>
        ),
      },
      {
        headerName: "IBAN",
        field: "iban",
        minWidth: 170,
        flex: 1.5,
        hide: isMobile, // Mobilde yatay kaydırmayı azaltmak için gizlenebilir veya gösterilebilir
        cellRenderer: (params: any) => (
          <Typography sx={{ fontFamily: "monospace", fontSize: 12 }}>
            {params.value}
          </Typography>
        ),
      },
      {
        headerName: "Bakiye",
        field: "balance",
        minWidth: 120,
        width: 140,
        cellRenderer: (params: any) => (
          <Typography
            sx={{ fontWeight: 800, color: "#16a34a", fontSize: "0.85rem" }}
          >
            {Number(params.value).toLocaleString("tr-TR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            {params.data?.currency?.code || "TRY"}
          </Typography>
        ),
      },
      {
        headerName: "Durum",
        field: "status",
        width: 90,
        cellRenderer: (params: any) => {
          const isClosed = params.value === "CLOSED";
          const isBlocked = params.value === "BLOCKED";
          return (
            <Typography
              sx={{
                fontSize: "0.75rem",
                fontWeight: 700,
                color: isClosed ? "#64748b" : isBlocked ? "#f59e0b" : "#16a34a",
              }}
            >
              {isClosed ? "Kapalı" : isBlocked ? "Bloke" : "Aktif"}
            </Typography>
          );
        },
      },
    ],
    [isMobile],
  );

  const handleRowClick = (event: RowClickedEvent<Account>) => {
    if (!event.data) return;
    if (filterOnlyActive && event.data.status !== "ACTIVE") return;

    onChange(event.data);
    handleClose();
  };

  return (
    <Box sx={{ width: "100%" }}>
      <TextField
        fullWidth
        size="small"
        label={label}
        disabled={disabled}
        onClick={handleOpen}
        value={selectedAccount ? selectedAccount.accountNumber : ""}
        placeholder="Hesap seçmek için tıklayınız..."
        slotProps={{
          input: {
            readOnly: true,
            sx: { cursor: disabled ? "default" : "pointer" },
            endAdornment: (
              <InputAdornment position="end">
                {loading ? (
                  <CircularProgress size={18} />
                ) : (
                  <ArrowDropDownIcon
                    sx={{
                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "0.2s",
                      cursor: "pointer",
                    }}
                  />
                )}
              </InputAdornment>
            ),
          },
        }}
      />

      <Popover
        open={isOpen}
        anchorEl={anchorEl}
        onClose={handleClose}
        disableRestoreFocus
        anchorOrigin={{
          vertical: "bottom",
          horizontal: isMobile ? "center" : "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: isMobile ? "center" : "left",
        }}
        slotProps={{
          paper: {
            sx: {
              // Responsive genişlik ve yükseklik
              width: {
                xs: "calc(100vw - 32px)", // Mobilde kenarlardan 16px boşluk bırakır
                sm: 650,
                md: 750, // Masaüstünde daha ferah tablo alanı
              },
              maxWidth: "100vw",
              p: 1.5,
              borderRadius: 2.5,
              boxShadow: "0 12px 30px -4px rgba(0, 0, 0, 0.18)",
              border: "1px solid #e2e8f0",
            },
          },
        }}
      >
        <Box
          sx={{
            mb: 1,
            px: 0.5,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography
            variant="caption"
            sx={{ fontWeight: 700, color: "#64748b" }}
          >
            Seçmek istediğiniz hesabın satırına tıklayınız:
          </Typography>
        </Box>

        <div
          style={{
            height: isMobile ? 240 : 290,
            width: "100%",
          }}
        >
          <AgGridReact
            theme={themeAlpine}
            rowData={displayAccounts}
            columnDefs={columnDefs}
            loading={loading}
            onRowClicked={handleRowClick}
            rowSelection={{ mode: "singleRow", enableClickSelection: true }}
            getRowStyle={(params): RowStyle | undefined => {
              const isSelected = params.data?.id === selectedAccount?.id;
              const isBlocked = params.data?.status === "BLOCKED";
              const isClosed = params.data?.status === "CLOSED";

              if (isSelected) return { backgroundColor: "#e0f2fe" };
              if (isClosed || isBlocked)
                return { opacity: 0.5, cursor: "not-allowed" };
              return { cursor: "pointer" };
            }}
            overlayNoRowsTemplate="<span>Seçilebilecek hesap bulunamadı.</span>"
          />
        </div>
      </Popover>
    </Box>
  );
};
