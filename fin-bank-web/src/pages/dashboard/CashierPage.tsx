import React from "react";
import { Paper, Typography } from "@mui/material";

export const CashierPage: React.FC = () => (
  <Paper
    elevation={0}
    sx={{ p: 4, borderRadius: 3.5, border: "1px solid #e2e8f0" }}
  >
    <Typography variant="h6" sx={{ fontWeight: "bold" }}>
      Gişe Para Yatırma & Çekme Ekranı
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
      Hesaplar arası para transferi ve nakit hareketleri operasyonları.
    </Typography>
  </Paper>
);
