import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Box, Typography, Tabs, Tab, Alert, Card } from "@mui/material";
import { CustomerSearchCard } from "../../components/common/CustomerSearchCard";
import { WithdrawalPage } from "./WithdrawalPage";
import { DepositPage } from "./DepositPage";
import { TransferPage } from "./TransferPage";
import type { Customer } from "../../types/customer.types";
import api from "../../services/api";

export const CashierPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const customerIdParam = searchParams.get("customerId");

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );

  useEffect(() => {
    const loadCustomer = async (id: number) => {
      try {
        const res = await api.get<{ success: boolean; data: Customer[] }>(
          "/customers",
        );
        const found = res.data.data.find((c) => c.id === id);
        if (found) {
          setSelectedCustomer(found);
        }
      } catch (err) {
        console.error("Müşteri yüklenemedi:", err);
      }
    };

    if (
      customerIdParam &&
      (!selectedCustomer || selectedCustomer.id !== Number(customerIdParam))
    ) {
      loadCustomer(Number(customerIdParam));
    }
  }, [customerIdParam]);

  // URL'e göre aktif sekme (0: Çekme, 1: Yatırma, 2: Transfer/Virman)
  let currentTab = 0;
  if (location.pathname.includes("/deposit")) currentTab = 1;
  else if (location.pathname.includes("/transfer")) currentTab = 2;

  const handleTabChange = (_e: React.SyntheticEvent, newValue: number) => {
    const query = selectedCustomer ? `?customerId=${selectedCustomer.id}` : "";
    if (newValue === 0) navigate(`/dashboard/cashier/withdraw${query}`);
    else if (newValue === 1) navigate(`/dashboard/cashier/deposit${query}`);
    else if (newValue === 2) navigate(`/dashboard/cashier/transfer${query}`);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: "#0a192f" }}>
          Gişe & Nakit İşlemleri
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Müşteri vadesiz hesapları üzerinden nakit para çekme, yatırma ve
          virman işlemlerini yürütün.
        </Typography>
      </Box>

      {/* Müşteri Arama Kartı */}
      <CustomerSearchCard
        selectedCustomer={selectedCustomer}
        onSelectCustomer={(c) => {
          setSelectedCustomer(c);
          if (c) navigate(`${location.pathname}?customerId=${c.id}`);
          else navigate(location.pathname);
        }}
      />

      {/* Müşteri Doğrulandıysa Sekmeler Açılır */}
      {selectedCustomer ? (
        <Box>
          <Card
            sx={{
              mb: 3,
              borderRadius: 3,
              border: "1px solid #e2e8f0",
              boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
            }}
          >
            <Tabs
              value={currentTab}
              onChange={handleTabChange}
              sx={{ px: 2, pt: 1, borderBottom: "1px solid #e2e8f0" }}
            >
              <Tab
                label="Para Çekme (Ödeme)"
                sx={{ textTransform: "none", fontWeight: 700 }}
              />
              <Tab
                label="Para Yatırma (Tahsilat)"
                sx={{ textTransform: "none", fontWeight: 700 }}
              />
              <Tab
                label="Hesaplar Arası Virman"
                sx={{ textTransform: "none", fontWeight: 700 }}
              />
            </Tabs>
          </Card>

          {/* Sekme İçerikleri */}
          {currentTab === 0 && <WithdrawalPage customer={selectedCustomer} />}
          {currentTab === 1 && <DepositPage customer={selectedCustomer} />}
          {currentTab === 2 && <TransferPage customer={selectedCustomer} />}
        </Box>
      ) : (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          Lütfen işlem yapabilmek için yukarıdaki alandan bir müşteri
          sorgulayınız.
        </Alert>
      )}
    </Box>
  );
};
