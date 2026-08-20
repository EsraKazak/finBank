import { createBrowserRouter, Navigate } from "react-router-dom";
import { LoginPage } from "../pages/LoginPage";
import { DashboardPage } from "../pages/DashboardPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { ProtectedRoute } from "./ProtectedRoute";
import { PublicRoute } from "./PublicRoute";
import { ForgotPasswordPage } from "../pages/ForgotPasswordPage";
import { ResetPasswordPage } from "../pages/ResetPasswordPage";

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
    ],
  },

  // 2. Giriş Yapmış Kullanıcılara Özel Korumalı Alan
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/dashboard",
        element: <DashboardPage />,
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
