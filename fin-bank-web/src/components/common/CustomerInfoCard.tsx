import React from "react";
import type { Customer } from "../../types/customer.types";
import CloseIcon from "@mui/icons-material/Close";
import { Box, Typography, IconButton } from "@mui/material";

interface CustomerInfoCardProps {
  customer: Customer;
  onClear?: () => void;
}

export const CustomerInfoCard: React.FC<CustomerInfoCardProps> = ({
  customer,
  onClear,
}) => {
  return (
    <Box
      sx={{
        p: 1.5,
        mb: 2,
        borderRadius: 2,
        bgcolor: "#f8fafc",
        border: "1px solid #e2e8f0",
        display: "flex",
        alignItems: "center",
        gap: 2,
        flexWrap: "wrap",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <Typography
          sx={{ fontWeight: 800, color: "#0284c7", fontSize: "0.9rem" }}
        >
          {customer.customerNumber}
        </Typography>
        {onClear && (
          <IconButton
            size="small"
            onClick={onClear}
            sx={{ color: "#94a3b8", "&:hover": { color: "#ef4444" }, p: 0.3 }}
          >
            <CloseIcon sx={{ fontSize: 16 }} />
          </IconButton>
        )}
      </Box>

      {/* Ad Soyad */}
      <Typography
        sx={{ fontWeight: 700, color: "#0f172a", fontSize: "0.9rem" }}
      >
        {customer.firstName} {customer.lastName}
      </Typography>

      {/* TC */}
      <Typography sx={{ color: "#64748b", fontSize: "0.85rem" }}>
        {customer.identityNumber}
      </Typography>
    </Box>
  );
};
