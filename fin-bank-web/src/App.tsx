import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage";
// DashboardPage bileşenini kendi dosya yoluna göre import et
import { DashboardPage } from "./pages/DashboardPage";
import { ProtectedRoute } from "./routes/ProtectedRoute";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Herkese Açık (Public) Rotalar */}
        <Route path="/login" element={<LoginPage />} />

        {/* Korumalı (Protected) Rotalar */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          {/* İleride eklenecek transfer, ayarlar gibi sayfalar da bu bloğun içine yazılır */}
        </Route>

        {/* Eşleşmeyen tüm URL'leri login'e (veya 404 sayfasına) yönlendir */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
