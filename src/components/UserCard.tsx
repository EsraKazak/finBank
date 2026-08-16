import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Box,
  Divider,
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
  avatarUrl = "https://www.flaticon.com/free-icon/hacker_924915?term=avatar&page=1&position=16&origin=tag&related_id=924915",
  status,
  iban,
  Balance,
}) => {
  return (
    <Card sx={{ width: "100%", mt: 0, borderRadius: 2, boxShadow: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "stretch", gap: 2 }}>
            <Avatar
              src={avatarUrl}
              alt={name}
              sx={{
                width: 90,
                height: 90,
                boxShadow: 2,
                border: "2px solid #eee",
              }}
            />
            <Box
              sx={{
                display: "flex",
                flexGrow: 1,
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Box>
                <Typography variant="h5" component="div">
                  {name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {email}
                </Typography>
              </Box>
              <Chip
                label={status ? "Aktif Hesap" : "Pasif Hesap"}
                color={status ? "success" : "default"}
                sx={{ fontWeight: "bold", px: 1 }}
              />
            </Box>
          </Box>
          <Divider sx={{ my: 2 }} />
          <Box
            sx={{ display: "flex", justifyContent: "space-between", gap: 4 }}
          >
            <Box>
              <Typography variant="caption">IBAN</Typography>
              <Typography variant="body1">{iban}</Typography>
            </Box>

            <Box sx={{ textAlign: "right" }}>
              <Typography variant="caption">Bakiye</Typography>
              <Typography variant="body1">{Balance} TL</Typography>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};
