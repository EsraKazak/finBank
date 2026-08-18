import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Refresh atıldığında token kontrolü bitene kadar beyaz ekran veya loading gösteririz.
  // Bu sayede kullanıcıyı haksız yere login sayfasına atmamış oluruz.
  if (isLoading) {
    return <div>Yükleniyor...</div>; // İleride buraya MUI Spinner/CircularProgress ekleyebilirsin
  }

  // Token kontrolü bitti ve kullanıcı hala yoksa (çıkış yapmış veya hiç girmemiş)
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Kullanıcı yetkiliyse, sarmalanmış alt componentleri ekrana basar
  return <Outlet />;
};
