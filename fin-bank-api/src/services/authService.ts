import userRepository from "../repositories/userRepository";
import {
  IAuthResponse,
  RolePermissions,
  UserRole,
  Permission,
} from "../types/user.types";
import { Role } from "@prisma/client";
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
  // Yöneticinin beyaz listeye rol seçerek personel ekleme fonksiyonu
  async addAuthorizedPersonnel(data: {
    name: string;
    surname: string;
    email: string;
    role: Role;
  }) {
    const existing = await userRepository.findAuthorizedEmail(data.email);
    if (existing) {
      throw new Error("Bu e-posta adresi zaten beyaz listede kayıtlı.");
    }

    return await userRepository.createAuthorizedPersonnel(data);
  }

  // Kullanıcının kayıt adımı
  async register(userData: {
    name: string;
    surname: string;
    username: string;
    email: string;
  }) {
    const authorized = await userRepository.findAuthorizedEmail(userData.email);
    if (!authorized) {
      throw new Error(
        "Bu e-posta adresi yetkilendirilmiş personel listesinde bulunamadı.",
      );
    }

    if (authorized.status === "COMPLETED") {
      throw new Error(
        "Bu e-posta adresi için personel kaydı zaten tamamlanmış.",
      );
    }

    const existingUser = await userRepository.findByUsername(userData.username);
    if (existingUser) {
      throw new Error("Bu kullanıcı adı zaten kullanılmaktadır.");
    }

    const existingEmail = await userRepository.findByEmail(userData.email);
    if (existingEmail) {
      throw new Error("Bu e-posta adresiyle zaten aktif bir kullanıcı mevcut.");
    }

    // Kullanıcı rolü doğrudan beyaz listeden alınır
    const newUser = await userRepository.createUser({
      name: userData.name,
      surname: userData.surname,
      username: userData.username,
      email: userData.email,
      password: "",
      role: authorized.role,
    });

    const setupToken = crypto.randomBytes(32).toString("hex");

    try {
      await redis.set(
        `reset_token:${setupToken}`,
        newUser.username,
        "EX",
        86400,
      );
      const fullName = `${newUser.name} ${newUser.surname}`;
      await MailService.sendInvitationEmail(
        newUser.email,
        fullName,
        setupToken,
      );
      await userRepository.markAuthorizedAsCompleted(userData.email);
    } catch (mailError: any) {
      await userRepository.deleteUser(newUser.id).catch(() => {});
      await redis.del(`reset_token:${setupToken}`).catch(() => {});
      console.error(
        "Mail gönderim hatası nedeniyle kayıt geri alındı:",
        mailError,
      );
      throw new Error(
        "E-posta gönderimi başarısız oldu. Lütfen tekrar deneyiniz.",
      );
    }

    return {
      id: newUser.id,
      name: newUser.name,
      surname: newUser.surname,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role as unknown as UserRole,
    };
  }

  // Login fonksiyonu: Role ve Permissions eklenmiş hali
  async login(username: string, password: string): Promise<IAuthResponse> {
    const user = await userRepository.findByUsername(username);
    if (!user || !user.password) {
      throw new Error(
        "Kullanıcı bulunamadı veya henüz ilk şifre belirlenmemiş.",
      );
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      throw new Error("Hatalı şifre girdiniz.");
    }

    const assignedRole =
      (user.role as unknown as UserRole) || UserRole.GISE_YETKILISI;
    const permissions: Permission[] = RolePermissions[assignedRole] || [];

    const payload = {
      id: user.id,
      username: user.username,
      name: user.name,
      surname: user.surname,
      role: assignedRole,
      permissions,
    };

    const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, {
      expiresIn: "15m",
    });

    const refreshToken = jwt.sign(
      { id: user.id, username: user.username },
      REFRESH_TOKEN_SECRET,
      { expiresIn: "1d" },
    );

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
        permissions,
      },
    };
  }

  async logout(refreshToken: string): Promise<void> {
    try {
      const decoded: any = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
      if (decoded && decoded.id) {
        await redis.del(`refresh_token:${decoded.id}`);
      }
    } catch {
      console.warn("Logout sırasında token doğrulanamadı.");
    }
  }

  async refreshAccessToken(
    refreshToken: string,
  ): Promise<{ accessToken: string }> {
    if (!refreshToken) {
      throw new Error("Refresh token bulunamadı.");
    }

    let decoded: any;
    try {
      decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
    } catch {
      throw new Error("Geçersiz veya süresi dolmuş refresh token.");
    }

    const storedToken = await redis.get(`refresh_token:${decoded.id}`);
    if (!storedToken || storedToken !== refreshToken) {
      throw new Error("Refresh token geçersiz veya oturum sonlandırılmış.");
    }

    const user = await userRepository.findByUsername(decoded.username);
    if (!user) {
      throw new Error("Kullanıcı bulunamadı.");
    }

    const assignedRole =
      (user.role as unknown as UserRole) || UserRole.GISE_YETKILISI;
    const permissions: Permission[] = RolePermissions[assignedRole] || [];

    const accessToken = jwt.sign(
      {
        id: user.id,
        username: user.username,
        name: user.name,
        surname: user.surname,
        role: assignedRole,
        permissions,
      },
      ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" },
    );

    return { accessToken };
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error("Bu e-posta adresiyle kayıtlı bir personel bulunamadı.");
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    await redis.set(`reset_token:${resetToken}`, user.username, "EX", 900);

    await MailService.sendPasswordResetEmail(user.email, resetToken, user.name);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const username = await redis.get(`reset_token:${token}`);
    if (!username) {
      throw new Error("Bağlantının süresi dolmuş veya geçersiz.");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await userRepository.updatePassword(username, hashedPassword);

    await redis.del(`reset_token:${token}`);
  }
}

export default new AuthService();
