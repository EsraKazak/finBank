import React from "react";
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
} from "@mui/material";
import { TransferType } from "../types/transfer";

interface TransferFormProps {
  iban: string;
  onIbanChange: (iban: string) => void;
  balance?: number;
  onBalanceChange?: (balance: number) => void;
  description?: string;
  onDescriptionChange?: (description: string) => void;
  transferType?: TransferType;
  setTransferType?: (transferType: TransferType) => void;
}

export const TransferForm: React.FC<TransferFormProps> = ({
  iban,
  onIbanChange,
  balance = 0,
  onBalanceChange,
  description = "",
  onDescriptionChange,
  transferType = TransferType.Havale,
  setTransferType,
}) => {
  const handleIbanInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const onlyDigits = e.target.value.replace(/\D/g, "").slice(0, 26);
    const formattedIban = onlyDigits.replace(/(.{4})/g, "$1 ").trim();
    onIbanChange(formattedIban);
  };

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 2,
        mt: 2,
      }}
    >
      <TextField
        label="Alıcı IBAN"
        variant="outlined"
        fullWidth
        sx={{ gridColumn: "span 2" }}
        value={iban}
        onChange={handleIbanInputChange}
      />
      <TextField
        label="Miktar"
        type="number"
        variant="outlined"
        fullWidth
        value={balance}
        onChange={(e) =>
          onBalanceChange && onBalanceChange(Number(e.target.value))
        }
      />

      <TextField
        label="Açıklama"
        variant="outlined"
        fullWidth
        sx={{ gridColumn: "span 2" }}
        value={description}
        onChange={(e) =>
          onDescriptionChange && onDescriptionChange(e.target.value)
        }
      />
      <FormControl fullWidth>
        <InputLabel id="transfer-type-label">Transfer Türü</InputLabel>
        <Select
          labelId="transfer-type-label"
          value={transferType}
          label="Transfer Türü"
          onChange={(e) =>
            setTransferType && setTransferType(e.target.value as TransferType)
          }
        >
          <MenuItem value={TransferType.Havale}>Havale</MenuItem>
          <MenuItem value={TransferType.EFT}>EFT</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
};
