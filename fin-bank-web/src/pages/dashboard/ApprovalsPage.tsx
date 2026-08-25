import React from "react";
import { Paper, Typography } from "@mui/material";

export const ApprovalsPage: React.FC = () => (
  <Paper
    elevation={0}
    sx={{ p: 4, borderRadius: 3.5, border: "1px solid #e2e8f0" }}
  >
    <Typography variant="h6" sx={{ fontWeight: "bold" }}>
      Limit Üstü İşlem Onay Masası
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
      Gişe yetkililerinin gönderdiği 50.000 TL üstü transfer onayları.
    </Typography>
  </Paper>
);
