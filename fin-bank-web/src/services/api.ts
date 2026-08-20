// src/services/api.ts

import axios from "axios";

// Canlı ortamda (Render) VITE_API_BASE_URL kullanılır, yerelde localhost'a döner
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
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // KRİTİK NOKTA: İstek login isteğiyse refresh token döngüsüne sokma ve sayfayı yenileme!
    // Hatayı doğrudan LoginPage'deki catch bloğuna ilet.
    if (originalRequest?.url?.includes("/auth/login")) {
      return Promise.reject(error);
    }

    // Login dışındaki korumalı isteklerde 401 alındıysa token yenilemeyi dene
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");

        if (!refreshToken) {
          throw new Error("Refresh token bulunamadı.");
        }

        // Burada da sabit localhost yerine dinamik BASE_URL kullanıyoruz
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

        // Sadece oturumu gerçekten düşmüş kullanıcıyı login'e at
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

export default api;
