export interface IUser {
  id: string;
  name: string;
  surname: string;
  username: string;
  email: string;
  password?: string;
  role: string[];
  permissions: string[];
  createdAt?: Date;
}

export interface ILoginRequest {
  username: string;
  password: string;
}

export interface IAuthResponse {
  accessToken: string;
  user: Omit<IUser, "password">;
  refreshToken?: string;
}
