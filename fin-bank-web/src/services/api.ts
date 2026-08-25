import axios from "axios";
import type { IAdminUserItem, IRole, IPermission } from "../types/auth.types";

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  user: {
    id: string;
    name: string;
    surname: string;
    username: string;
  };
}

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Login veya me isteğinde refresh döngüsüne girmeden hatayı fırlat
    if (
      originalRequest?.url?.includes("/auth/login") ||
      originalRequest?.url?.includes("/auth/me")
    ) {
      return Promise.reject(error);
    }

    // Diğer korumalı isteklerde 401 alındıysa refresh token dene
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) throw new Error("Refresh token yok.");

        const response = await axios.post<{ accessToken: string }>(
          `${BASE_URL}/auth/refresh`,
          { refreshToken },
        );

        const { accessToken } = response.data;
        localStorage.setItem("accessToken", accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");

        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export const loginUser = async (
  username: string,
  password: string,
): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>("/auth/login", {
    username,
    password,
  });
  return response.data;
};

export const adminApi = {
  addAuthorizedPersonnel: async (data: {
    name: string;
    surname: string;
    email: string;
    roleId: string;
  }) => {
    const response = await api.post("/auth/authorized-personnel", data);
    return response.data;
  },

  getAuthorizedPersonnelList: async () => {
    const response = await api.get("/auth/authorized-personnel");
    return response.data;
  },

  getUsers: async () => {
    const response = await api.get<{ data: IAdminUserItem[] }>("/admin/users");
    return response.data.data;
  },

  getRolesAndPermissions: async () => {
    const response = await api.get<{
      data: { roles: IRole[]; permissions: IPermission[] };
    }>("/admin/roles-permissions");
    return response.data.data;
  },

  assignRole: async (userId: string, roleId: string) => {
    const response = await api.post("/admin/assign-role", { userId, roleId });
    return response.data;
  },
};

export default api;
