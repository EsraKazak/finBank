import React, { useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Divider,
} from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";

export interface IReceiptData {
  receiptNumber: string;
  transactionDate: string;
  type: string;
  amount: number | string;
  description: string;
  branch: {
    code: string;
    name: string;
    city: string;
  };
  account?: {
    accountNumber: number;
    iban: string;
    name: string;
    currency?: {
      code: string;
    };
  } | null;
  createdBy?: {
    name: string;
    surname: string;
    username: string;
  };
}

interface ReceiptPrintModalProps {
  open: boolean;
  onClose: () => void;
  data: IReceiptData | null;
  logoSrc?: string;
}

export const ReceiptPrintModal: React.FC<ReceiptPrintModalProps> = ({
  open,
  onClose,
  data,
}) => {
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!data) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedAmount = Number(data.amount).toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogContent sx={{ p: { xs: 2, sm: 4 } }}>
        {/* YAZDIRILACAK ALAN */}
        <Box
          id="printable-receipt"
          ref={printAreaRef}
          sx={{
            p: 4,
            border: "2px solid #cbd5e1",
            borderRadius: 2,
            bgcolor: "#fff",
            color: "#0f172a",
            fontFamily:
              "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          }}
        >
          {/* Logo & Başlık */}
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
                mb: 1,
              }}
            >
              <img
                src="/favicon.png"
                alt="FinBank Logo"
                style={{
                  height: 54,
                  width: "auto",
                  objectFit: "contain",
                  display: "block",
                }}
              />
              <Typography
                variant="h4"
                sx={{ fontWeight: 900, letterSpacing: 2, color: "#0d47a1" }}
              >
                FIN-BANK A.Ş.
              </Typography>
            </Box>

            <Typography
              variant="body1"
              sx={{
                color: "text.secondary",
                fontWeight: 600,
                fontSize: "1.05rem",
              }}
            >
              {data.branch.code} - {data.branch.name} Şubesi /{" "}
              {data.branch.city}
            </Typography>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                mt: 1.5,
                letterSpacing: 1.2,
                textTransform: "uppercase",
                color: "#1e293b",
              }}
            >
              İŞLEM DEKONTU & FİŞİ
            </Typography>
          </Box>

          <Divider sx={{ borderStyle: "dashed", borderWidth: 1.5, my: 3 }} />

          {/* Fiş Detayları */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
              fontSize: "1rem",
              mb: 3,
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="body1">
                <strong>Fiş No:</strong> {data.receiptNumber}
              </Typography>
              <Typography variant="body1">
                <strong>Tarih:</strong>{" "}
                {new Date(data.transactionDate).toLocaleString("tr-TR")}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="body1">
                <strong>İşlem Türü:</strong> {data.type}
              </Typography>
              <Typography variant="body1">
                <strong>İşlem Yapan:</strong>{" "}
                {data.createdBy
                  ? `${data.createdBy.name} ${data.createdBy.surname}`
                  : "Sistem Yöneticisi"}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ borderStyle: "dashed", borderWidth: 1.5, my: 3 }} />

          {/* Hesap Bilgileri */}
          {data.account && (
            <Box
              sx={{
                mb: 3,
                display: "flex",
                flexDirection: "column",
                gap: 1,
              }}
            >
              <Typography variant="body1">
                <strong>Hesap Sahibi / Adı:</strong> {data.account.name}
              </Typography>
              <Typography variant="body1">
                <strong>Hesap No:</strong> {data.account.accountNumber}
              </Typography>
              <Typography
                variant="body1"
                sx={{ fontFamily: "monospace", fontSize: "1.05rem" }}
              >
                <strong>IBAN:</strong> {data.account.iban}
              </Typography>
            </Box>
          )}

          {/* Tutar Kutusu */}
          <Box
            sx={{
              bgcolor: "#f8fafc",
              border: "1.5px solid #e2e8f0",
              p: 2.5,
              borderRadius: 2,
              my: 3,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 800, color: "#334155" }}>
              İŞLEM TUTARI:
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, color: "#0d47a1" }}>
              {formattedAmount} {data.account?.currency?.code || "TRY"}
            </Typography>
          </Box>

          <Typography
            variant="body1"
            sx={{ fontSize: "1rem", mb: 4, lineHeight: 1.6 }}
          >
            <strong>Açıklama:</strong> {data.description}
          </Typography>

          <Divider sx={{ borderStyle: "dashed", borderWidth: 1.5, my: 3 }} />

          <Typography
            variant="caption"
            sx={{
              display: "block",
              textAlign: "center",
              color: "text.secondary",
              mt: 3,
              fontSize: "0.85rem",
            }}
          >
            Bu belge FIN-BANK Bankacılık Sistemi tarafından elektronik ortamda
            üretilmiştir. Islak imza veya mühür gerektirmez.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          p: 3,
          pt: 0,
          justifyContent: "space-between",
          "@media print": { display: "none !important" },
        }}
      >
        <Button onClick={onClose} color="inherit" sx={{ fontWeight: 600 }}>
          Kapat
        </Button>
        <Button
          onClick={handlePrint}
          variant="contained"
          startIcon={<PrintIcon />}
          sx={{
            fontWeight: 700,
            px: 3,
            background: "linear-gradient(135deg, #1976d2 0%, #0d47a1 100%)",
          }}
        >
          Yazdır / PDF Kaydet
        </Button>
      </DialogActions>
    </Dialog>
  );
};
