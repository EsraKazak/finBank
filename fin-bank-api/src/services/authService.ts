import userRepository from "../repositories/userRepository";
import { IAuthResponse, IUser } from "../types/user.types";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import redis from "../config/redis";
import crypto from "crypto";
import { MailService } from "./mailService";

const ACCESS_TOKEN_SECRET =
  process.env.JWT_ACCESS_SECRET ||
  process.env.JWT_SECRET ||
  "access_secret_key";
const REFRESH_TOKEN_SECRET =
  process.env.JWT_REFRESH_SECRET || "refresh_secret_key";

class AuthService {
  async register(userData: {
    name: string;
    surname: string;
    username: string;
    email: string;
    password?: string;
    role?: IUser["role"];
  }) {
    // 1. Kullanıcı adı daha önce alınmış mı kontrol et
    const existingUser = await userRepository.findByUsername(userData.username);
    if (existingUser) {
      throw new Error("Bu kullanıcı adı zaten kullanılmaktadır.");
    }

    const existingEmail = await userRepository.findByEmail(userData.email);
    if (existingEmail) {
      throw new Error("Bu e-posta adresi zaten kullanılmaktadır.");
    }

    // 2. Şifreyi hash'le
    const hashedPassword = await bcrypt.hash(userData.password || "", 10);

    // 3. Yeni banko asistanı kullanıcısını oluştur
    const newUser: IUser = {
      id: Date.now().toString(),
      name: userData.name,
      surname: userData.surname,
      username: userData.username,
      email: userData.email,
      password: hashedPassword,
      role: userData.role || "BANKO_ASISTANI",
      createdAt: new Date(),
    };

    // 4. Redis'e kaydet
    await userRepository.createUser(newUser);

    return {
      id: newUser.id,
      name: newUser.name,
      surname: newUser.surname,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
    };
  }

  async login(username: string, password: string): Promise<IAuthResponse> {
    const user = await userRepository.findByUsername(username);
    if (!user || !user.password) {
      throw new Error("Kullanıcı bulunamadı.");
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      throw new Error("Hatalı şifre girdiniz.");
    }

    const assignedRole = user.role || "BANKO_ASISTANI";
    const payload = {
      id: user.id,
      username: user.username,
      name: user.name,
      surname: user.surname,
      role: assignedRole,
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
        role: assignedRole,
      },
    };
  }

  async logout(refreshToken: string): Promise<void> {
    try {
      // 1. Token'ı çözerek içindeki kullanıcı ID'sini al
      const decoded: any = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);

      if (decoded && decoded.id) {
        // 2. Redis'teki refresh_token:<id> anahtarını sil
        await redis.del(`refresh_token:${decoded.id}`);
      }
    } catch (error) {
      // Token'ın süresi zaten dolmuş veya geçersizse hata fırlatmadan devam et
      console.warn("Logout sırasında token doğrulanamadı veya zaten silinmiş.");
    }
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
        role: user.role || "BANKO_ASISTANI",
      },
      ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" },
    );

    return { accessToken };
  }

  // unutulan şifreyi sıfılamak için
  async forgotPassword(email: string): Promise<void> {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      // Güvenlik gereği kullanıcı bulunamadı demek yerine mail gönderildi mesajı verebiliriz,
      // ancak geliştirme aşamasında kullanıcıyı uyarmak için hata fırlatıyoruz:
      throw new Error("Bu e-posta adresiyle kayıtlı bir personel bulunamadı.");
    }

    // 1. Rastgele benzersiz token üret
    const resetToken = crypto.randomBytes(32).toString("hex");

    // 2. Token'ı Redis'e 15 dakika (900 saniye) geçerli olacak şekilde kaydet
    await redis.set(`reset_token:${resetToken}`, user.username, "EX", 900);

    // 3. Resend ile personele mail gönder
    await MailService.sendPasswordResetEmail(user.email, resetToken, user.name);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    // 1. Token Redis'te var mı ve geçerli mi?
    const username = await redis.get(`reset_token:${token}`);
    if (!username) {
      throw new Error(
        "Şifre sıfırlama bağlantısının süresi dolmuş veya geçersiz.",
      );
    }

    // 2. Yeni şifreyi hashle
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 3. Kullanıcının şifresini güncelle
    await userRepository.updatePassword(username, hashedPassword);

    // 4. Kullanılan token'ı Redis'ten hemen sil (tek kullanımlık olsun)
    await redis.del(`reset_token:${token}`);
  }
}

export default new AuthService();
