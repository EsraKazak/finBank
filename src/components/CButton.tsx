import React from "react";
import {
  Button as MuiButton,
  type ButtonProps as MuiButtonProps,
  CircularProgress,
} from "@mui/material";

// MUI'ın ButtonProps tipini miras alıyoruz
interface CButtonProps extends MuiButtonProps {
  isLoading?: boolean;
}

export const CButton: React.FC<CButtonProps> = ({
  children,
  isLoading = false,
  disabled,
  ...props
}) => {
  return (
    <MuiButton
      {...props}
      disabled={disabled || isLoading}
      // MUI'ın hazır ripple efekti, stilleri ve özellikleri aynen çalışır
      startIcon={
        isLoading ? (
          <CircularProgress size={20} color="inherit" />
        ) : (
          props.startIcon
        )
      }
    >
      {isLoading ? "Lütfen Bekleyin..." : children}
    </MuiButton>
  );
};
