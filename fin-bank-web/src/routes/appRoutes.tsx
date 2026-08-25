import { createBrowserRouter, Navigate } from "react-router-dom";
import { LoginPage } from "../pages/LoginPage";
import { DashboardPage } from "../pages/DashboardPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { ProtectedRoute } from "./ProtectedRoute";
import { PublicRoute } from "./PublicRoute";
import { ForgotPasswordPage } from "../pages/ForgotPasswordPage";
import { ResetPasswordPage } from "../pages/ResetPasswordPage";
import { SetupPasswordPage } from "../pages/SetupPasswordPage";

// Dashboard Alt Sayfaları
import { OverviewPage } from "../pages/dashboard/OverviewPage";
import { WhitelistPage } from "../pages/dashboard/WhitelistPage";
import { RolesPage } from "../pages/dashboard/RolesPage";
import { CustomersPage } from "../pages/dashboard/CustomersPage";
import { CashierPage } from "../pages/dashboard/CashierPage";
import { ApprovalsPage } from "../pages/dashboard/ApprovalsPage";
import { EndOfDayPage } from "../pages/dashboard/EndOfDayPage";
import { AuditPage } from "../pages/dashboard/AuditPage";

export const router = createBrowserRouter([
  // 1. Sadece Giriş Yapmamışlara Açık Alan
  {
    element: <PublicRoute />,
    children: [
      {
        path: "/login",
        element: <LoginPage />,
      },
      {
        path: "/forgot-password",
        element: <ForgotPasswordPage />,
      },
      {
        path: "/reset-password",
        element: <ResetPasswordPage />,
      },
      {
        path: "/setup-password",
        element: <SetupPasswordPage />,
      },
    ],
  },

  // 2. Giriş Yapmış Kullanıcılara Özel Korumalı Alan
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/dashboard",
        element: <DashboardPage />,
        children: [
          {
            index: true, // /dashboard adresine gelince açılır
            element: <OverviewPage />,
          },
          {
            path: "whitelist", // /dashboard/whitelist
            element: <WhitelistPage />,
          },
          {
            path: "roles", // /dashboard/roles
            element: <RolesPage />,
          },
          {
            path: "customers", // /dashboard/customers
            element: <CustomersPage />,
          },
          {
            path: "cashier", // /dashboard/cashier
            element: <CashierPage />,
          },
          {
            path: "approvals", // /dashboard/approvals
            element: <ApprovalsPage />,
          },
          {
            path: "eod", // /dashboard/eod
            element: <EndOfDayPage />,
          },
          {
            path: "audit", // /dashboard/audit
            element: <AuditPage />,
          },
        ],
      },
    ],
  },

  // 3. Ana Dizin Yönlendirmesi
  {
    path: "/",
    element: <Navigate to="/dashboard" replace />,
  },

  // 4. Bulunamayan Sayfalar (404)
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
