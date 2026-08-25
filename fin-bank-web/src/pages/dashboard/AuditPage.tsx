import React from "react";
import { Paper, Typography } from "@mui/material";

export const AuditPage: React.FC = () => (
  <Paper
    elevation={0}
    sx={{ p: 4, borderRadius: 3.5, border: "1px solid #e2e8f0" }}
  >
    <Typography variant="h6" sx={{ fontWeight: "bold" }}>
      Denetim İzleri ve Sistem Logları
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
      Sistemde yapılan tüm işlemlerin log geçmişi.
    </Typography>
  </Paper>
);
