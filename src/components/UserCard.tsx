import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Avatar,
  Stack,
  Chip,
} from "@mui/material";

interface UserCardProps {
  name: string;
  email: string;
  avatarUrl?: string;
  iban: string;
  Balance: number;
  status: boolean;
}

export const UserCard: React.FC<UserCardProps> = ({
  name,
  email,
  avatarUrl,
  status,
  iban,
  Balance,
}) => {
  return (
    <Card variant="outlined" sx={{ width: "100%", mt: 0 }}>
      <CardContent>
        <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
          <Avatar src={avatarUrl} alt={name} sx={{ width: 100, height: 100 }} />
          <Stack spacing={1}>
            <Typography variant="h5" component="div">
              {name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {email}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              IBAN: {iban}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Bakiye: {Balance} TL
            </Typography>
          </Stack>
          <Stack spacing={1} sx={{ ml: "auto", textAlign: "right" }}>
            <Chip
              label={status ? "Aktif Hesap" : "Pasif Hesap"}
              color={status ? "success" : "default"}
            />
            <Typography variant="body2" color="text.secondary">
              iBAN: {iban}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Bakiye: {Balance} TL
            </Typography>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};
