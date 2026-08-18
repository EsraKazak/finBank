import React from "react";

interface CInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const CInput: React.FC<CInputProps> = ({ label, ...props }) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <label style={{ fontSize: "14px", fontWeight: 500, color: "#333" }}>
        {label}
      </label>
      <input
        {...props}
        style={{
          padding: "10px 12px",
          borderRadius: "6px",
          border: "1px solid #ccc",
          fontSize: "14px",
          outline: "none",
          ...props.style,
        }}
      />
    </div>
  );
};
