import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Card,
  Typography,
  Chip,
  Button,
  Tooltip,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import { AgGridReact } from "ag-grid-react";
import type { ColDef, RowClickedEvent, RowStyle } from "ag-grid-community";
import api from "../../services/api";
import type { Account } from "../../types/account.types";

export interface CustomerAccountsGridProps {
  customerId: number;
  title?: string;
  selectedAccountId?: number | null;
  onSelectAccount?: (account: Account) => void;
  renderActions?: (account: Account) => React.ReactNode;
  /** İsim düzenleme butonu ve modalı aktif olsun mu? */
  allowRename?: boolean;
  allowStatusToggle?: boolean;
  includeClosed?: boolean;
  refreshTrigger?: number;
  height?: number | string;
}

export const CustomerAccountsGrid: React.FC<CustomerAccountsGridProps> = ({
  customerId,
  title = "Müşteriye Ait Vadesiz Hesaplar",
  selectedAccountId,
  onSelectAccount,
  renderActions,
  allowRename = false,
  allowStatusToggle = false,
  includeClosed = false,
  refreshTrigger = 0,
  height = 260,
}) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // İsim Düzenleme Modal State'leri (Bileşen içine taşındı)
  const [accountToEdit, setAccountToEdit] = useState<Account | null>(null);
  const [editAccountName, setEditAccountName] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ success: boolean; data: Account[] }>(
        `/accounts/customer/${customerId}`,
      );

      let demandAccounts = (res.data.data || []).filter(
        (a) => a.product?.type === "DEMAND",
      );

      if (!includeClosed) {
        demandAccounts = demandAccounts.filter((a) => a.status !== "CLOSED");
      }

      setAccounts(demandAccounts);

      if (onSelectAccount) {
        if (selectedAccountId) {
          const updated = demandAccounts.find(
            (a) => a.id === selectedAccountId,
          );
          if (updated) onSelectAccount(updated);
        } else if (demandAccounts.length > 0) {
          const firstActive = demandAccounts.find((a) => a.status === "ACTIVE");
          if (firstActive) onSelectAccount(firstActive);
        }
      }
    } catch (err) {
      console.error("Hesaplar alınamadı:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customerId) {
      fetchAccounts();
    }
  }, [customerId, refreshTrigger, includeClosed]);

  // Hesap Adı Güncelleme API Çağrısı
  const handleSaveRename = async () => {
    if (!accountToEdit || !editAccountName.trim()) return;
    try {
      setIsSaving(true);
      await api.patch(`/accounts/${accountToEdit.id}/name`, {
        name: editAccountName.trim(),
      });
      setAccountToEdit(null);
      await fetchAccounts(); // Tabloyu anında güncelle
    } catch (err: any) {
      alert(err.response?.data?.message || "Hesap adı güncellenemedi.");
    } finally {
      setIsSaving(false);
    }
  };
  // hesap durumu güncelleme
  const handleToggleBlock = async (account: Account) => {
    const nextStatus = account.status === "ACTIVE" ? "BLOCKED" : "ACTIVE";
    try {
      await api.patch(`/accounts/${account.id}/status`, { status: nextStatus });
      await fetchAccounts();
    } catch (err: any) {
      alert(err.response?.data?.message || "Hesap durumu güncellenemedi.");
    }
  };

  const columnDefs = useMemo<ColDef<Account>[]>(() => {
    const cols: ColDef<Account>[] = [
      {
        headerName: "Ek No",
        field: "accountNumber",
        width: 100,
        cellRenderer: (params: any) => (
          <Typography sx={{ fontWeight: 700, fontSize: "0.85rem" }}>
            {params.value}
          </Typography>
        ),
      },
      {
        headerName: "Hesap Adı / Tanımı",
        field: "name",
        flex: 1.3,
        cellRenderer: (params: any) => (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <Typography sx={{ fontWeight: 600, fontSize: "0.85rem" }}>
              {params.value}
            </Typography>
            {/* allowRename açıksa ve hesap kapalı değilse kaleme tıklandığında modal açılır */}
            {allowRename && params.data?.status !== "CLOSED" && (
              <Tooltip title="Hesap Adını Değiştir">
                <IconButton
                  size="small"
                  color="primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAccountToEdit(params.data);
                    setEditAccountName(params.data.name);
                  }}
                  sx={{ p: 0.5 }}
                >
                  <EditIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
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
              maximumFractionDigits: 2,
            })}{" "}
            {params.data?.currency?.code || "TRY"}
          </Typography>
        ),
      },
      {
        headerName: "Durum",
        field: "status",
        width: 170,
        cellRenderer: (params: any) => {
          const acc = params.data as Account;
          const isClosed = acc.status === "CLOSED";
          const isBlocked = acc.status === "BLOCKED";

          return (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                height: "100%",
              }}
            >
              <Chip
                label={isClosed ? "Kapalı" : isBlocked ? "Bloke" : "Aktif"}
                color={isClosed ? "default" : isBlocked ? "warning" : "success"}
                size="small"
                sx={{ fontWeight: 600, fontSize: 11 }}
              />
              {allowStatusToggle && !isClosed && (
                <Button
                  size="small"
                  variant="outlined"
                  color={isBlocked ? "success" : "warning"}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleBlock(acc);
                  }}
                  sx={{
                    textTransform: "none",
                    fontSize: 10,
                    py: 0.2,
                    px: 1,
                    borderRadius: 1.5,
                  }}
                >
                  {isBlocked ? "Bloke Kaldır" : "Bloke Et"}
                </Button>
              )}
            </Box>
          );
        },
      },
    ];

    if (renderActions) {
      cols.push({
        headerName: "İşlemler",
        field: "id",
        flex: 1.4,
        sortable: false,
        filter: false,
        cellClass: "ag-cell-center",
        headerClass: "ag-header-cell-center",
        cellRenderer: (params: any) => (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
              gap: 1,
            }}
          >
            {renderActions(params.data)}
          </Box>
        ),
      });
    } else if (onSelectAccount) {
      cols.push({
        headerName: "İşlem",
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
      });
    }

    return cols;
  }, [
    selectedAccountId,
    onSelectAccount,
    renderActions,
    allowRename,
    allowStatusToggle,
  ]);

  const handleRowClick = (event: RowClickedEvent<Account>) => {
    if (
      onSelectAccount &&
      event.data &&
      event.data.status !== "BLOCKED" &&
      event.data.status !== "CLOSED"
    ) {
      onSelectAccount(event.data);
    }
  };

  return (
    <>
      <Card
        sx={{
          borderRadius: 3,
          boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
          border: "1px solid #e2e8f0",
          mb: 3,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            p: 2,
            bgcolor: "#f8fafc",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 700, color: "#334155" }}
          >
            {title}
          </Typography>
          {loading && <CircularProgress size={18} />}
        </Box>

        <div className="ag-theme-alpine" style={{ height, width: "100%" }}>
          <AgGridReact
            rowData={accounts}
            columnDefs={columnDefs}
            loading={loading}
            animateRows={true}
            onRowClicked={handleRowClick}
            rowSelection="single"
            getRowStyle={(params): RowStyle | undefined => {
              if (params.data?.status === "CLOSED") return { opacity: 0.5 };
              if (params.data?.id === selectedAccountId)
                return { backgroundColor: "#f0f7ff" };
              return undefined;
            }}
            overlayNoRowsTemplate="<span>Müşteriye ait aktif vadesiz hesap bulunamadı.</span>"
          />
        </div>
      </Card>

      {/* Hesap Adı Güncelleme Modalı (Bileşenin Kendi İçinde) */}
      <Dialog
        open={Boolean(accountToEdit)}
        onClose={() => setAccountToEdit(null)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3, p: 1 } } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Hesap Adını Güncelle</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            label="Yeni Hesap Adı"
            fullWidth
            value={editAccountName}
            onChange={(e) => setEditAccountName(e.target.value)}
            size="small"
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setAccountToEdit(null)}
            color="inherit"
            disabled={isSaving}
          >
            İptal
          </Button>
          <Button
            onClick={handleSaveRename}
            variant="contained"
            disabled={isSaving || !editAccountName.trim()}
          >
            {isSaving ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Kaydet"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
