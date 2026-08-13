import React from "react";
import {
  TextField,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";

interface TransferFormProps {
  iban: string;
  setIban: (iban: string) => void;
  balance?: number;
  setBalance?: (balance: number) => void;
  description?: string;
  setDescription?: (description: string) => void;
  transferType?: string;
  setTransferType?: (transferType: string) => void;
}

export const TransferForm: React.FC<TransferFormProps> = ({
  iban,
  setIban,
  balance,
  setBalance,
  description,
  setDescription,
  transferType,
  setTransferType,
}) => {
  return (
    <Stack spacing={2} sx={{ mt: 2 }}>
      <TextField
        label="Alıcı IBAN"
        variant="outlined"
        fullWidth
        value={iban}
        onChange={(e) => {
          const onlyDigits = e.target.value.replace(/\D/g, "").slice(0, 26); // Remove non-digit characters and limit to 26 digits
          const formattedIban = onlyDigits.replace(/(.{4})/g, "$1 ").trim();
          setIban(formattedIban);
        }}
      />
      <TextField
        label="Miktar"
        variant="outlined"
        fullWidth
        value={balance}
        onChange={(e) => setBalance && setBalance(Number(e.target.value))}
      />
      <TextField
        label="Açıklama"
        variant="outlined"
        fullWidth
        value={description}
        onChange={(e) => setDescription && setDescription(e.target.value)}
      />
      <FormControl fullWidth>
        <InputLabel id="transfer-type-label">Transfer Türü</InputLabel>
        <Select
          labelId="transfer-type-label"
          value={transferType}
          onChange={(e) =>
            setTransferType && setTransferType(e.target.value as string)
          }
        >
          <MenuItem value="havale">Havale</MenuItem>
          <MenuItem value="eft">EFT</MenuItem>
        </Select>
      </FormControl>
    </Stack>
  );
};
