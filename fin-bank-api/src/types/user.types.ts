//tip güvenliği için kullanıcı şifresi tipini IUser'den LoginResponse'dan çıkardık.
export interface IUser {
  id: string;
  name: string;
  surname: string;
  username: string;
  email: string;
  password?: string;
  refreshToken?: string;
}

export interface ILoginRequest {
  username: string;
  password: string;
}

//burada omit kullanarak password alanını çıkardık çünkü kullanıcıya şifreyi geri göndermemeliyiz.
export interface IAuthResponse {
  accessToken: string;
  user: Omit<IUser, "password">;
  refreshToken?: string;
}
