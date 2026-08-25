// src/routes/RoleGuard.tsx
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

interface RoleGuardProps {
  requiredPermission?: string;
  allowedRoles?: string[];
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  requiredPermission,
  allowedRoles,
}) => {
  const { user } = useAuth();

  // Rolün string veya string[] olma durumunu normalize etme
  const userRoles: string[] = Array.isArray(user?.role)
    ? (user.role as string[])
    : typeof user?.role === "string"
      ? [user.role]
      : [];

  const isYonetici = userRoles.includes("YONETICI");

  // 1. Yönetici ise tüm sayfalara tam erişim
  if (isYonetici) {
    return <Outlet />;
  }

  // 2. Rol kontrolü
  if (allowedRoles && allowedRoles.length > 0) {
    const hasRole = userRoles.some((r) => allowedRoles.includes(r));
    if (!hasRole) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // 3. Yetki (Permission) kontrolü
  if (requiredPermission && !user?.permissions?.includes(requiredPermission)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};
