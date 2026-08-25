import React from "react";
import { Paper, Typography } from "@mui/material";

export const EndOfDayPage: React.FC = () => (
  <Paper
    elevation={0}
    sx={{ p: 4, borderRadius: 3.5, border: "1px solid #e2e8f0" }}
  >
    <Typography variant="h6" sx={{ fontWeight: "bold" }}>
      Şube Gün Sonu Kapanış ve Kasa Mutabakatı
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
      Günlük şube kasa bakiyelerini doğrulayıp günü kapatma paneli.
    </Typography>
  </Paper>
);
