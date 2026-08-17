//tip güvenliği için kullanıcı şifresi tipini IUser'den LoginResponse'dan çıkardık.
export interface IUser {
  id: string;
  name: string;
  surname: string;
  username: string;
  password?: string;
}

export interface ILoginRequest {
  username: string;
  password: string;
}

//burada omit kullanarak password alanını çıkardık çünkü kullanıcıya şifreyi geri göndermemeliyiz.
export interface IAuthResponse {
  token: string;
  user: Omit<IUser, "password">;
}
