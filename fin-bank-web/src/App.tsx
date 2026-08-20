import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { router } from "./routes/appRoutes";
import { CookieBanner } from "./components/CookieBanner";
function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <CookieBanner />
    </AuthProvider>
  );
}

export default App;
