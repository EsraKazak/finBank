import { createBrowserRouter, Navigate } from "react-router-dom";
import { LoginPage } from "../pages/LoginPage";
import { DashboardPage } from "../pages/DashboardLayout";
import { NotFoundPage } from "../pages/NotFoundPage";
import { ProtectedRoute } from "./ProtectedRoute";
import { PublicRoute } from "./PublicRoute";
import { RoleGuard } from "./RoleGuard";
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
import { DemandAccountsPage } from "../pages/dashboard/DemandAccountsPage";

export const router = createBrowserRouter([
  // 1. Sadece Giriş Yapmamışlara Açık Alan (Public)
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

  // 2. Giriş Yapmış Kullanıcılara Özel Korumalı Alan (Protected + Role Guard)
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/dashboard",
        element: <DashboardPage />,
        children: [
          // Ortak Ana Sayfa (Tüm personeller erişebilir)
          {
            index: true,
            element: <OverviewPage />,
          },

          // Sadece Yönetici / Personel Yönetimi Yetkisi Olanlar
          {
            element: <RoleGuard requiredPermission="personel:yonetimi" />,
            children: [
              {
                path: "whitelist",
                element: <WhitelistPage />,
              },
              {
                path: "roles",
                element: <RolesPage />,
              },
            ],
          },

          // Müşteri Yönetimi Yetkisi
          {
            element: <RoleGuard requiredPermission="musteri:goruntule" />,
            children: [
              {
                path: "customers",
                element: <CustomersPage />,
              },
              {
                path: "demand-accounts",
                element: <DemandAccountsPage />,
              },
            ],
          },
          // Gişe İşlemleri Yetkisi
          {
            element: <RoleGuard requiredPermission="para:yatirma" />,
            children: [
              {
                path: "cashier",
                element: <CashierPage />,
                children: [
                  {
                    index: true,
                    element: <Navigate to="withdraw" replace />,
                  },
                  {
                    path: "withdraw",
                    element: <CashierPage />,
                  },
                  {
                    path: "deposit",
                    element: <CashierPage />,
                  },
                  {
                    path: "transfer",
                    element: <CashierPage />,
                  },
                ],
              },
            ],
          },

          // Onay Yetkisi (Şube Müdürü vb.)
          {
            element: <RoleGuard requiredPermission="islem:limit_ustu:onay" />,
            children: [
              {
                path: "approvals",
                element: <ApprovalsPage />,
              },
            ],
          },

          // Gün Sonu Mutabakatı
          {
            element: <RoleGuard requiredPermission="sube:gun_sonu:kapatma" />,
            children: [
              {
                path: "eod",
                element: <EndOfDayPage />,
              },
            ],
          },

          // Denetim & Loglar
          {
            element: <RoleGuard requiredPermission="denetim:kayit:goruntule" />,
            children: [
              {
                path: "audit",
                element: <AuditPage />,
              },
            ],
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
