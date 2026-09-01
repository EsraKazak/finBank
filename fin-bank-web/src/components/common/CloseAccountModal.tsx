import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  Box,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import PaymentsIcon from "@mui/icons-material/Payments";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import api from "../../services/api";
import type { Account } from "../../types/account.types";

interface CloseAccountModalProps {
  open: boolean;
  onClose: () => void;
  account: Account | null;
  customerId: number;
  onSuccess: () => void;
}

export const CloseAccountModal: React.FC<CloseAccountModalProps> = ({
  open,
  onClose,
  account,
  customerId,
  onSuccess,
}) => {
  const navigate = useNavigate();
  const [closingType, setClosingType] = useState<"TRANSFER" | "CASH">(
    "TRANSFER",
  );
  const [targetAccountId, setTargetAccountId] = useState<number | null>(null);
  const [availableAccounts, setAvailableAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const balance = Number(account?.balance || 0);
  const hasBalance = balance > 0;

  // Modal her açıldığında müşterinin aynı para birimindeki diğer aktif hesaplarını çek
  useEffect(() => {
    if (open && customerId && account) {
      setErrorMessage(null);
      setTargetAccountId(null);

      const fetchTargetAccounts = async () => {
        try {
          const res = await api.get<{ success: boolean; data: Account[] }>(
            `/accounts/customer/${customerId}`,
          );

          // Kapatılacak hesap hariç, aktif ve aynı para birimindeki hesaplar
          const validTargets = (res.data.data || []).filter(
            (a) =>
              a.id !== account.id &&
              a.status === "ACTIVE" &&
              a.currencyId === account.currencyId,
          );

          setAvailableAccounts(validTargets);

          // Alternatif aktif hesap yoksa doğrudan Nakit seçeneğine sabitle
          if (validTargets.length === 0) {
            setClosingType("CASH");
          } else {
            setClosingType("TRANSFER");
          }
        } catch (err) {
          console.error("Müşteri hesapları yüklenemedi:", err);
        }
      };

      fetchTargetAccounts();
    }
  }, [open, customerId, account]);

  const handleConfirm = async () => {
    if (!account) return;
    setErrorMessage(null);

    // Senaryo 1: Nakit Çekim Seçildiyse Gişe Sayfasına Yönlendir
    if (hasBalance && closingType === "CASH") {
      onClose();
      navigate(
        `/dashboard/cashier/withdraw?customerId=${customerId}&accountId=${account.id}`,
      );
      return;
    }

    // Senaryo 2: Virman Seçildiyse Hedef Hesap Zorunlu
    if (hasBalance && closingType === "TRANSFER" && !targetAccountId) {
      setErrorMessage("Lütfen bakiyenin aktarılacağı hedef hesabı seçiniz.");
      return;
    }

    // Senaryo 3: Backend Kapatma İsteği
    try {
      setIsLoading(true);
      await api.patch(`/accounts/${account.id}/status`, {
        status: "CLOSED",
        transferToAccountId:
          closingType === "TRANSFER" ? targetAccountId : undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message ||
          "Hesap kapatma işlemi sırasında bir hata oluştu.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!account) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}
      >
        <WarningAmberRoundedIcon color="warning" />
        Hesap Kapatma Onayı
      </DialogTitle>

      <DialogContent dividers>
        {errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        )}

        <Typography variant="body1" sx={{ mb: 1 }}>
          <strong>
            [{account.accountNumber}] {account.name}
          </strong>{" "}
          hesabını kapatmak üzeresiniz.
        </Typography>

        {hasBalance ? (
          <Box sx={{ mt: 2 }}>
            <Alert severity="warning" sx={{ mb: 2 }}>
              Bu hesapta halen{" "}
              <strong>
                {balance.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}{" "}
                {account.currency?.code || "TRY"}
              </strong>{" "}
              bakiye bulunmaktadır. Hesabın kapatılabilmesi için bakiyenin
              tahliye edilmesi gerekmektedir.
            </Alert>

            {availableAccounts.length > 0 ? (
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  bgcolor: "#f8fafc",
                  borderRadius: 2,
                  border: "1px solid #e2e8f0",
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Bakiye Tahliye Yöntemi:
                </Typography>
                <RadioGroup
                  value={closingType}
                  onChange={(e) =>
                    setClosingType(e.target.value as "TRANSFER" | "CASH")
                  }
                  sx={{ mb: 2 }}
                >
                  <FormControlLabel
                    value="TRANSFER"
                    control={<Radio size="small" />}
                    label="Başka Bir Hesabıma Aktar (Virman Yap ve Kapat)"
                  />
                  <FormControlLabel
                    value="CASH"
                    control={<Radio size="small" />}
                    label="Gişeden Nakit Çek (Gişe Sayfasına Yönlendir)"
                  />
                </RadioGroup>

                {closingType === "TRANSFER" && (
                  <FormControl fullWidth size="small" required sx={{ mt: 1 }}>
                    <InputLabel>Bakiyenin Aktarılacağı Hedef Hesap</InputLabel>
                    <Select
                      value={targetAccountId ?? ""}
                      label="Bakiyenin Aktarılacağı Hedef Hesap"
                      onChange={(e) =>
                        setTargetAccountId(Number(e.target.value))
                      }
                    >
                      {availableAccounts.map((acc) => (
                        <MenuItem key={acc.id} value={acc.id}>
                          [{acc.accountNumber}] {acc.name} — Bakiye:{" "}
                          {Number(acc.balance).toLocaleString("tr-TR", {
                            minimumFractionDigits: 2,
                          })}{" "}
                          {acc.currency?.code}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              </Box>
            ) : (
              <Alert severity="info" sx={{ mt: 1 }}>
                Müşteriye ait aynı para biriminde başka aktif hesap bulunamadı.
                Bakiyeyi tahliye etmek için <strong>Gişe Nakit Çekim</strong>{" "}
                ekranına yönlendirileceksiniz.
              </Alert>
            )}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Hesap bakiyesi sıfırdır. Onayladığınız takdirde hesap kalıcı olarak
            kapatılacaktır.
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={isLoading}>
          Vazgeç
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color={hasBalance && closingType === "CASH" ? "primary" : "error"}
          startIcon={
            hasBalance && closingType === "CASH" ? (
              <PaymentsIcon />
            ) : (
              <CancelOutlinedIcon />
            )
          }
          disabled={
            isLoading ||
            (hasBalance && closingType === "TRANSFER" && !targetAccountId)
          }
          sx={{
            fontWeight: 700,
            textTransform: "none",
            borderRadius: 2,
            px: 2.5,
          }}
        >
          {isLoading ? (
            <CircularProgress size={22} color="inherit" />
          ) : hasBalance && closingType === "CASH" ? (
            "Gişeye Git & Nakit Çek"
          ) : (
            "Hesabı Kapat"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
