import userRepository from "../repositories/userRepository";
import { IAuthResponse } from "../types/user.types";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import redis from "../config/redis";

const ACCESS_TOKEN_SECRET =
  process.env.JWT_ACCESS_SECRET ||
  process.env.JWT_SECRET ||
  "access_secret_key";
const REFRESH_TOKEN_SECRET =
  process.env.JWT_REFRESH_SECRET || "refresh_secret_key";

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

    const payload = {
      id: user.id,
      username: user.username,
      name: user.name,
      surname: user.surname,
    };

    // 1. Kısa ömürlü Access Token (15 dakika)
    const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, {
      expiresIn: "15m",
    });

    // 2. Uzun ömürlü Refresh Token (7 gün) - içine username de koyuyoruz
    const refreshToken = jwt.sign(
      { id: user.id, username: user.username },
      REFRESH_TOKEN_SECRET,
      { expiresIn: "1d" },
    );

    // 3. Refresh Token'ı Redis'e kaydet (ioredis uyumlu: EX süresi)
    await redis.set(
      `refresh_token:${user.id}`,
      refreshToken,
      "EX",
      7 * 24 * 60 * 60,
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        surname: user.surname,
        username: user.username,
        email: user.email || "",
      },
    };
  }

  async refreshAccessToken(
    refreshToken: string,
  ): Promise<{ accessToken: string }> {
    if (!refreshToken) {
      throw new Error("Refresh token bulunamadı.");
    }

    // 1. Token Doğrulama
    let decoded: any;
    try {
      decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
    } catch {
      throw new Error("Geçersiz veya süresi dolmuş refresh token.");
    }

    // 2. Redis'teki Token Kontrolü
    const storedToken = await redis.get(`refresh_token:${decoded.id}`);
    if (!storedToken || storedToken !== refreshToken) {
      throw new Error("Refresh token geçersiz veya oturum sonlandırılmış.");
    }

    // 3. Kullanıcıyı username üzerinden bulma
    const user = await userRepository.findByUsername(decoded.username);
    if (!user) {
      throw new Error("Kullanıcı bulunamadı.");
    }

    // 4. Yeni Access Token Üretme
    const accessToken = jwt.sign(
      {
        id: user.id,
        username: user.username,
        name: user.name,
        surname: user.surname,
      },
      ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" },
    );

    return { accessToken };
  }
}

export default new AuthService();
