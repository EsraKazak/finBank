import React from "react";
import type { LoginResponse } from "../../services/api";
import { CButton } from "../../components/CButton";

interface UserCardProps {
  user: LoginResponse["user"];
  onLogout: () => void;
}

export const UserCard: React.FC<UserCardProps> = ({ user, onLogout }) => {
  return (
    <div style={{ textAlign: "center" }}>
      <h2>
        Hoş Geldiniz, {user.name} {user.surname}! 🎉
      </h2>
      <p>
        <strong>Kullanıcı Adı:</strong> @{user.username}
      </p>
      <p>
        <strong>Kullanıcı ID:</strong> {user.id}
      </p>
      <div style={{ marginTop: "20px" }}>
        <CButton
          onClick={onLogout}
          style={{ backgroundColor: "#ff4d4f", color: "#fff" }}
        >
          Çıkış Yap
        </CButton>
      </div>
    </div>
  );
};
