import userRepository from "../repositories/userRepository";
import { IAuthResponse } from "../types/user.types";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

class AuthService {
  async login(username: string, password: string): Promise<IAuthResponse> {
    const user = await userRepository.findByUsername(username);
    if (!user || !user.password) {
      throw new Error("Kullanıcı bulunamadı.");
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      throw new Error("Hatalı şifre girdiniz.");
    }

    //şifre ve kullanıcı adı doğru ise jwt token üretiliyor bu token 2 saat geçerli hale geliyor
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        name: user.name,
        surname: user.surname,
      },
      // burada .env dpsyasından JWT_SECRET alınır eğer yoksa default olarak "secret_key" kullanılır ama ileride güvenlik açığına sebep olur dikkat
      process.env.JWT_SECRET || "secret_key",
      { expiresIn: "2h" },
    );

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        surname: user.surname,
        username: user.username,
      },
    };
  }
}

export default new AuthService();
