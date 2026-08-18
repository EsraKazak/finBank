import { useAuth } from "../hooks/useAuth";

export const DashboardPage = () => {
  const { user, logout } = useAuth();

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Dashboard</h1>
      <p>Hoş geldin, {user?.name || user?.email || "Kullanıcı"}!</p>

      <button
        onClick={logout}
        style={{
          padding: "8px 16px",
          marginTop: "1rem",
          cursor: "pointer",
        }}
      >
        Çıkış Yap
      </button>
    </div>
  );
};
