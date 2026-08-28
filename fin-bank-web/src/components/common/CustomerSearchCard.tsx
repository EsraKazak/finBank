import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  InputAdornment,
  CircularProgress,
  Chip,
  Alert,
  Tooltip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import PersonIcon from "@mui/icons-material/Person";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import api from "../../services/api";
import type { Customer } from "../../types/customer.types";

interface CustomerSearchCardProps {
  /**
   * Üst sayfadan gelen seçili müşteri nesnesi.
   * Null ise arama kutusu görünür, dolu ise özet kart görünür.
   */
  selectedCustomer: Customer | null;
  /**
   * Müşteri seçildiğinde veya seçim iptal edildiğinde (null) üst sayfayı bilgilendiren fonksiyon.
   */
  onSelectCustomer: (customer: Customer | null) => void;
  /**
   * Kartın üzerinde görünecek özel başlık (Opsiyonel)
   */
  title?: string;
}

export const CustomerSearchCard: React.FC<CustomerSearchCardProps> = ({
  selectedCustomer,
  onSelectCustomer,
  title = "Müşteri Sorgulama & Doğrulama",
}) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Müşteri Arama Fonksiyonu
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();

    if (!query) {
      setErrorMessage(
        "Lütfen geçerli bir T.C. Kimlik No veya Müşteri No giriniz.",
      );
      return;
    }

    try {
      setIsSearching(true);
      setErrorMessage(null);

      // Müşteri listesini çekip aranan değere göre eşleştiriyoruz
      const res = await api.get<{ success: boolean; data: Customer[] }>(
        "/customers",
      );
      const foundCustomer = res.data.data.find(
        (c) =>
          c.identityNumber === query || c.customerNumber.toString() === query,
      );

      if (foundCustomer) {
        onSelectCustomer(foundCustomer);
        setSearchQuery(""); // Arama başarılı olunca inputu temizliyoruz
      } else {
        setErrorMessage("Müşteri bulunamadı. Lütfen bilgileri kontrol ediniz.");
      }
    } catch (err: any) {
      console.error("Müşteri arama hatası:", err);
      setErrorMessage(
        err.response?.data?.message ||
          "Müşteri aranırken sunucu kaynaklı bir hata oluştu.",
      );
    } finally {
      setIsSearching(false);
    }
  };

  // Müşteriyi Temizleme / Farklı Müşteri Çağırma
  const handleClearSelection = () => {
    onSelectCustomer(null);
    setSearchQuery("");
    setErrorMessage(null);
  };

  return (
    <Card
      sx={{
        borderRadius: 3,
        boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
        border: "1px solid #e2e8f0",
        mb: 3,
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        {/* Kart Başlığı */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 700,
              color: "#475569",
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            {title}
          </Typography>
          {selectedCustomer && (
            <Chip
              icon={<CheckCircleOutlineRoundedIcon />}
              label="Müşteri Doğrulandı"
              size="small"
              color="success"
              variant="outlined"
              sx={{ fontWeight: 600, fontSize: 11 }}
            />
          )}
        </Box>

        {errorMessage && (
          <Alert
            severity="error"
            sx={{ mb: 2, borderRadius: 2 }}
            onClose={() => setErrorMessage(null)}
          >
            {errorMessage}
          </Alert>
        )}

        {/* 1. DURUM: Müşteri henüz seçilmediyse ARAMA INPUTU gösterilir */}
        {!selectedCustomer ? (
          <form onSubmit={handleSearch}>
            <Box sx={{ display: "flex", gap: 1.5 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="11 Haneli T.C. Kimlik No veya 8 Haneli Müşteri No giriniz..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <Button
                type="submit"
                variant="contained"
                disabled={isSearching}
                sx={{
                  minWidth: 140,
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 700,
                  bgcolor: "#0a192f",
                  "&:hover": { bgcolor: "#1e293b" },
                }}
              >
                {isSearching ? (
                  <CircularProgress size={22} color="inherit" />
                ) : (
                  "Müşteri Bul"
                )}
              </Button>
            </Box>
          </form>
        ) : (
          /* 2. DURUM: Müşteri bulunduysa ÖZET PROFİL KARTI gösterilir */
          <Box
            sx={{
              p: 2,
              borderRadius: 2.5,
              bgcolor: "#f8fafc",
              border: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            {/* Sol Taraf: Avatar ve İsim Bilgileri */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2.5,
                  bgcolor: "#e0f2fe",
                  color: "#0284c7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <PersonIcon sx={{ fontSize: 28 }} />
              </Box>

              <Box>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 800, color: "#0f172a" }}
                >
                  {selectedCustomer.firstName} {selectedCustomer.lastName}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: 13 }}
                >
                  Müşteri No:{" "}
                  <strong style={{ color: "#0f172a" }}>
                    {selectedCustomer.customerNumber}
                  </strong>{" "}
                  &nbsp;|&nbsp; T.C. Kimlik:{" "}
                  <strong style={{ color: "#0f172a" }}>
                    {selectedCustomer.identityNumber}
                  </strong>
                </Typography>
              </Box>
            </Box>

            {/* Sağ Taraf: Şube Rozeti ve Değiştir Butonu */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Chip
                label={`Şube: ${selectedCustomer.branch?.code || ""} - ${selectedCustomer.branch?.name || "Merkez"}`}
                variant="outlined"
                sx={{ fontWeight: 600, bgcolor: "#fff" }}
              />

              <Tooltip title="Farklı Bir Müşteri Çağır">
                <Button
                  size="small"
                  variant="outlined"
                  color="inherit"
                  startIcon={<RestartAltIcon />}
                  onClick={handleClearSelection}
                  sx={{
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 600,
                    borderColor: "#cbd5e1",
                    bgcolor: "#fff",
                  }}
                >
                  Müşteriyi Değiştir
                </Button>
              </Tooltip>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};
