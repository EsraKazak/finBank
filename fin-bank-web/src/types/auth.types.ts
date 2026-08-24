export interface User {
  id: string;
  name: string;
  surname: string;
  username: string;
  email?: string;
  role: string[];
  permissions?: string[];
}

export type SafeUser = Omit<User, "password">;

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: User;
}

export interface AuthContextType {
  user: SafeUser | null;
  isAuthenticated: boolean;
  accessToken: string | null;
  isLoading: boolean;
  login: (username: string, pass: string) => Promise<void>;
  logout: () => void;
}

// Admin Yönetim Tipleri
export interface IRole {
  id: string;
  name: string;
}

export interface IPermission {
  id: string;
  code: string;
}

export interface IAdminUserItem {
  id: string;
  name: string;
  surname: string;
  username: string;
  email: string;
  createdAt: string;
  userRole?: {
    role: IRole;
  } | null;
  userPermissions?: {
    permission: IPermission;
  }[];
}
