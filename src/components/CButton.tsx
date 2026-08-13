import React from "react";
import Button, { type ButtonProps } from "@mui/material/Button";

interface CButtonProps extends ButtonProps {
  label: string;
}

export const CButton: React.FC<CButtonProps> = ({ label, ...props }) => {
  return (
    <Button variant="contained" {...props}>
      {label}
    </Button>
  );
};
