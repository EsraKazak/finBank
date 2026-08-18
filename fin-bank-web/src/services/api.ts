import axios from "axios";

const api = axios.create({
  //Axios'un bir instance'ı oluşturuluyor, baseURL sabitleniyor. Böylece her istekte http://localhost:5000/api/... yazmak yerine sadece /auth/login gibi kısa yol yeterli oluyor.
  baseURL: "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// backendeki ıauthresponse de herhengi bir değişiklikde burayı da değiştirmem gerekir birebir benzeri bu
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
    // Yanıt başarılıysa (200, 201 vb.) doğrudan döndür
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Eğer 401 hatası aldıysak ve bu isteği daha önce tekrar denememişsek (_retry)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Sonsuz döngüye girmemesi için bayrak koyuyoruz

      try {
        const refreshToken = localStorage.getItem("refreshToken");

        // Refresh token yoksa doğrudan oturumu sonlandır
        if (!refreshToken) {
          throw new Error("Refresh token bulunamadı.");
        }

        // Yenileme isteği atarken döngüye girmemek için düz axios kullanıyoruz
        const response = await axios.post<{ accessToken: string }>(
          "http://localhost:5000/api/auth/refresh",
          { refreshToken },
        );

        const { accessToken } = response.data;

        // Yeni Access Token'ı hafızaya yaz
        localStorage.setItem("accessToken", accessToken);

        // Yarım kalan orijinal isteğin başlığını yeni token ile güncelle
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        // Orijinal isteği tekrar çalıştır ve sonucunu dön
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh token da geçersiz veya süresi dolmuşsa tüm oturumu temizle
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");

        // Kullanıcıyı login sayfasına yönlendir
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

//backenddeki apiye istek atıp bu tipte değer istiyoruz dediğimiz yer
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
