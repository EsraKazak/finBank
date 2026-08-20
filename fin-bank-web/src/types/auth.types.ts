export type UserRole = "BANKO_ASISTANI" | "ADMIN";

// 1. Sistemdeki kullanıcı verisinin tipi
export interface User {
  id: string;
  name: string;
  surname: string;
  username: string;
  email?: string;
  role: string; // Rolleri sonra ekleyeceğimiz için şimdiden opsiyonel olarak koyabilirsin
}
// Şifresiz güvenli kullanıcı tipi
export type SafeUser = Omit<User, "password">;

// 3. Backend login endpoint'inden dönen cevap tipi
export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: User;
}

// kullanıcıyı dışarıya açmak için kullanırız burada token a bakar hala kullanıcı olup olmadığını kontrol ederiz. Eğer kullanıcı yoksa null döneriz. diğerleri de bnzer mantıktır.
export interface AuthContextType {
  user: SafeUser | null;
  isAuthenticated: boolean;
  accessToken: string | null;
  isLoading: boolean;
  login: (username: string, pass: string) => Promise<void>;
  logout: () => void;
}
