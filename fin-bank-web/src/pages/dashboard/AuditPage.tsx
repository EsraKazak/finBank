import React, { useEffect, useState } from "react";
import {
  Paper,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import { adminApi } from "../../services/api";
import type { IAuditLogItem } from "../../services/api";

export const AuditPage: React.FC = () => {
  const [logs, setLogs] = useState<IAuditLogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getAuditLogs();
      setLogs(data);
    } catch (error) {
      console.error("Denetim logları alınamadı:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getCategoryChip = (category: IAuditLogItem["category"]) => {
    switch (category) {
      case "FINANCIAL":
        return (
          <Chip
            label="Finansal İşlem"
            size="small"
            color="success"
            variant="outlined"
          />
        );
      case "CUSTOMER":
        return (
          <Chip
            label="Müşteri İşlemi"
            size="small"
            color="primary"
            variant="outlined"
          />
        );
      case "ACCOUNT":
        return (
          <Chip
            label="Hesap İşlemi"
            size="small"
            color="secondary"
            variant="outlined"
          />
        );
      default:
        return <Chip label={category} size="small" variant="outlined" />;
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{ p: 4, borderRadius: 3.5, border: "1px solid #e2e8f0" }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            Denetim İzleri ve Sistem Logları
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Sistemde gerçekleşen finansal hareketler, müşteri ve hesap kayıt
            geçmişi.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchLogs}
          disabled={loading}
          sx={{ borderRadius: 2 }}
        >
          Yenile
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress size={36} />
        </Box>
      ) : logs.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Typography variant="body2" color="text.secondary">
            Henüz listelenecek bir sistem hareketi bulunamadı.
          </Typography>
        </Box>
      ) : (
        <TableContainer sx={{ border: "1px solid #edf2f7", borderRadius: 2 }}>
          <Table size="medium">
            <TableHead sx={{ backgroundColor: "#f8fafc" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Tarih / Saat</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Kategori</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>İşlem Tipi</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Açıklama & Detay</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>
                  İşlemi Yapan Personel
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Şube</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id} hover>
                  <TableCell
                    sx={{
                      whiteSpace: "nowrap",
                      color: "text.secondary",
                      fontSize: "0.875rem",
                    }}
                  >
                    {new Date(log.date).toLocaleString("tr-TR")}
                  </TableCell>
                  <TableCell>{getCategoryChip(log.category)}</TableCell>
                  <TableCell sx={{ fontWeight: 500, fontSize: "0.875rem" }}>
                    {log.action}
                  </TableCell>
                  <TableCell sx={{ fontSize: "0.875rem", maxWidth: 400 }}>
                    {log.description}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 500, fontSize: "0.875rem" }}>
                    {log.performedBy}
                  </TableCell>
                  <TableCell
                    sx={{ color: "text.secondary", fontSize: "0.875rem" }}
                  >
                    {log.branchName || "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
};

export default AuditPage;
