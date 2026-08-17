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
  token: string;
  user: {
    id: string;
    name: string;
    surname: string;
    username: string;
  };
}

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
