// src/pages/dashboard/TimeAccountClosePage.tsx
import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Paper,
  Chip,
} from "@mui/material";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import api from "../../services/api";
import type { Customer } from "../../types/customer.types";
import type { Account } from "../../types/account.types";
import { CustomerSearchCard } from "../../components/common/CustomerSearchCard";
import { CustomerAccountSelect } from "../../components/common/CustomerAccountSelect";
import { CloseAccountModal } from "../../components/common/CloseAccountModal";
import { ReceiptPrintModal } from "../../components/ReceiptPrintModal";
import type { IReceiptData } from "../../components/ReceiptPrintModal";

export const TimeAccountClosePage: React.FC = () => {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(
    null,
  );
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [openReceiptModal, setOpenReceiptModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<IReceiptData | null>(
    null,
  );
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleOpenReceipt = async (accountId: number) => {
    try {
      const res = await api.get(`/accounting?accountId=${accountId}`);
      if (res.data.data?.length > 0) {
        setSelectedReceipt(res.data.data[0]);
        setOpenReceiptModal(true);
      } else {
        alert("Fiş kaydı bulunamadı.");
      }
    } catch {
      alert("Fiş yüklenirken hata oluştu.");
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
        Vadeli Hesap Kapatma
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Müşterinin vadeli mevduat hesabını kapatıp bakiyesini vadesiz hesaba
        aktarabilirsiniz.
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

      <CustomerSearchCard
        selectedCustomer={selectedCustomer}
        onSelectCustomer={(c) => {
          setSelectedCustomer(c);
          setSelectedAccountId(null);
          setSelectedAccount(null);
        }}
      />

      {selectedCustomer && (
        <Card sx={{ mt: 3, borderRadius: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
              Kapatılacak Vadeli Hesabı Seçiniz:
            </Typography>

            <CustomerAccountSelect
              customerId={selectedCustomer.id}
              selectedAccountId={selectedAccountId}
              includeClosed={true}
              filterOnlyActive={false}
              refreshTrigger={refreshTrigger}
              allowedProductTypes={["TIME"]} // Sadece vadeli hesapları backend'den çeker[cite: 1]
              onChange={(acc) => {
                setSelectedAccountId(acc ? acc.id : null);
                setSelectedAccount(acc);
              }}
              label="Vadeli Hesap Seçiniz"
            />

            {selectedAccount && (
              <Paper
                variant="outlined"
                sx={{ p: 2.5, mt: 3, borderRadius: 2.5, bgcolor: "#f8fafc" }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                      [{selectedAccount.accountNumber}] {selectedAccount.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "#16a34a", fontWeight: 700, mt: 0.5 }}
                    >
                      Bakiye:{" "}
                      {Number(selectedAccount.balance).toLocaleString("tr-TR", {
                        minimumFractionDigits: 2,
                      })}{" "}
                      {selectedAccount.currency?.code}
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
                    <Chip
                      label={
                        selectedAccount.status === "CLOSED" ? "Kapalı" : "Aktif"
                      }
                      color={
                        selectedAccount.status === "CLOSED"
                          ? "default"
                          : "success"
                      }
                      size="small"
                    />

                    {selectedAccount.status === "CLOSED" ? (
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<ReceiptLongIcon />}
                        onClick={() => handleOpenReceipt(selectedAccount.id)}
                      >
                        Kapanış Fişi
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        color="error"
                        size="small"
                        startIcon={<CancelOutlinedIcon />}
                        onClick={() => setIsCloseModalOpen(true)}
                      >
                        Hesabı Kapat
                      </Button>
                    )}
                  </Box>
                </Box>
              </Paper>
            )}
          </CardContent>
        </Card>
      )}

      <CloseAccountModal
        open={isCloseModalOpen}
        onClose={() => setIsCloseModalOpen(false)}
        account={selectedAccount}
        customerId={selectedCustomer?.id || 0}
        allowCashPayout={false} // Vadeli hesapta nakit çıkışına izin verilmez[cite: 1]
        onSuccess={() => {
          setNotification({
            type: "success",
            message: "Vadeli hesap başarıyla kapatıldı.",
          });
          setSelectedAccountId(null);
          setSelectedAccount(null);
          setRefreshTrigger((p) => p + 1);
        }}
      />

      <ReceiptPrintModal
        open={openReceiptModal}
        onClose={() => setOpenReceiptModal(false)}
        data={selectedReceipt}
      />
    </Box>
  );
};
