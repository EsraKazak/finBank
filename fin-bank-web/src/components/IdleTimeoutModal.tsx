import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from "@mui/material";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";

interface IdleTimeoutModalProps {
  open: boolean;
  remainingSeconds: number;
  onStayLoggedIn: () => void;
  onLogout: () => void;
}

export const IdleTimeoutModal: React.FC<IdleTimeoutModalProps> = ({
  open,
  remainingSeconds,
  onStayLoggedIn,
  onLogout,
}) => {
  return (
    <Dialog
      open={open}
      onClose={(_, reason) => {
        // Backdrop tıklaması ve escape tuşunu devre dışı bırakır
        if (reason === "backdropClick" || reason === "escapeKeyDown") {
          return;
        }
      }}
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
            p: 1.5,
            maxWidth: 420,
            textAlign: "center",
          },
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: "flex", justifyContent: "center", mb: 1 }}>
          <WarningAmberRoundedIcon
            sx={{ fontSize: 52, color: "warning.main" }}
          />
        </Box>
        <Typography variant="h6" component="div" sx={{ fontWeight: 700 }}>
          Oturumunuz Kapanmak Üzere
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" color="text.secondary">
          Uzun süredir işlem yapmadığınız tespit edildi. Güvenliğiniz için{" "}
          <Typography
            component="span"
            sx={{ fontWeight: 700, color: "error.main" }}
          >
            {remainingSeconds} saniye
          </Typography>{" "}
          içerisinde oturumunuz otomatik olarak sonlandırılacaktır.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ justifyContent: "center", gap: 1, pb: 1 }}>
        <Button variant="outlined" color="inherit" onClick={onLogout}>
          Çıkış Yap
        </Button>
        <Button variant="contained" color="primary" onClick={onStayLoggedIn}>
          Oturumu Açık Tut
        </Button>
      </DialogActions>
    </Dialog>
  );
};
