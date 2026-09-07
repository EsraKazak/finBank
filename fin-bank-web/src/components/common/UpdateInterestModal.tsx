import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Slider,
  TextField,
  InputAdornment,
  Alert,
} from "@mui/material";
import PercentIcon from "@mui/icons-material/Percent";

interface UpdateInterestModalProps {
  open: boolean;
  onClose: () => void;
  currentRate: number;
  onConfirm: (newRate: number) => void;
  isLoading?: boolean;
}

export const UpdateInterestModal: React.FC<UpdateInterestModalProps> = ({
  open,
  onClose,
  currentRate,
  onConfirm,
  isLoading = false,
}) => {
  const [rate, setRate] = useState<number>(currentRate || 0);

  useEffect(() => {
    if (open) {
      setRate(currentRate || 0);
    }
  }, [open, currentRate]);

  const handleSliderChange = (_event: Event, newValue: number | number[]) => {
    setRate(newValue as number);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(event.target.value);
    if (!isNaN(val) && val >= 0 && val <= 100) {
      setRate(val);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
        Özel Faiz Oranı Belirle
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, my: 1 }}>
          <Alert severity="info">
            Slider üzerinden veya doğrudan değer girerek hesaba özel yeni faiz
            oranını belirleyebilirsiniz.
          </Alert>

          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <TextField
              label="Belirlenen Faiz Oranı"
              type="number"
              value={rate}
              onChange={handleInputChange}
              size="small"
              slotProps={{
                htmlInput: { min: 0, max: 100, step: 0.25 },
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <PercentIcon fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ width: 180 }}
            />
          </Box>

          <Box sx={{ px: 2 }}>
            <Typography variant="caption" color="text.primary" gutterBottom>
              Faiz Skalası (%0 - %100)
            </Typography>
            <Slider
              value={typeof rate === "number" ? rate : 0}
              onChange={handleSliderChange}
              aria-labelledby="interest-rate-slider"
              step={0.25}
              min={0}
              max={100}
              valueLabelDisplay="auto"
              marks={[
                { value: 0, label: "%0" },
                { value: 25, label: "%25" },
                { value: 50, label: "%50" },
                { value: 75, label: "%75" },
                { value: 100, label: "%100" },
              ]}
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={isLoading}>
          Vazgeç
        </Button>
        <Button
          onClick={() => onConfirm(rate)}
          variant="contained"
          color="primary"
          disabled={isLoading}
        >
          {isLoading ? "Güncelleniyor..." : "Oranı Uygula"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
