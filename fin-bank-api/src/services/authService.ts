import userRepository from "../repositories/userRepository";
import { IAuthResponse } from "../types/user.types";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import redis from "../config/redis";
import crypto from "crypto";
import { MailService } from "./mailService";
import { validatePassword } from "../utils/passwordValidator";

const ACCESS_TOKEN_SECRET =
  process.env.JWT_ACCESS_SECRET ||
  process.env.JWT_SECRET ||
  "access_secret_key";
const REFRESH_TOKEN_SECRET =
  process.env.JWT_REFRESH_SECRET || "refresh_secret_key";

class AuthService {
  // Türkçe karakterleri temizleyen ve standart formata getiren yardımcı
  private cleanTurkishChars(str: string): string {
    const trMap: { [key: string]: string } = {
      ç: "c",
      Ç: "c",
      ğ: "g",
      Ğ: "g",
      ı: "i",
      İ: "i",
      ö: "o",
      Ö: "o",
      ş: "s",
      Ş: "s",
      ü: "u",
      Ü: "u",
    };
    return str
      .replace(/[çÇğĞıİöÖşŞüÜ]/g, (match) => trMap[match] || match)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
  }

  // Benzersiz kurumsal kullanıcı adı üreten yardımcı (mgenc, mgenc1, mgenc2...)
  private async generateUniqueUsername(
    name: string,
    surname: string,
  ): Promise<string> {
    const cleanName = this.cleanTurkishChars(name.trim());
    const cleanSurname = this.cleanTurkishChars(surname.trim());

    if (!cleanName || !cleanSurname) {
      throw new Error("Geçerli bir ad ve soyad girilmelidir.");
    }

    const firstLetter = cleanName.charAt(0);
    const baseUsername = `${firstLetter}${cleanSurname}`;

    let candidate = baseUsername;
    let counter = 1;

    // Veritabanında kontrol et, çakışma varsa sonuna sayaç ekle
    while (await userRepository.findByUsername(candidate)) {
      candidate = `${baseUsername}${counter}`;
      counter++;
    }

    return candidate;
  }

  // Yöneticinin whitelist'e personel eklemesi
  async addAuthorizedPersonnel(data: {
    name: string;
    surname: string;
    email: string;
    roleId: string;
    branchId: number;
  }) {
    if (!data.branchId) {
      throw new Error("Personelin görev yapacağı şube seçimi zorunludur.");
    }

    const existing = await userRepository.findAuthorizedEmail(data.email);
    if (existing) {
      throw new Error(
        "Bu e-posta adresi zaten yetkilendirilmiş listede kayıtlı.",
      );
    }

    return await userRepository.createAuthorizedPersonnel(data);
  }

  // Kullanıcı Kaydı (Kayıt olunca rol otomatik UserRole tablosuna işlenir)
  async register(userData: { name: string; surname: string; email: string }) {
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

    const existingEmail = await userRepository.findByEmail(userData.email);
    if (existingEmail) {
      throw new Error("Bu e-posta adresiyle zaten aktif bir kullanıcı mevcut.");
    }

    // Benzersiz kurumsal kullanıcı adı
    const generatedUsername = await this.generateUniqueUsername(
      userData.name,
      userData.surname,
    );

    // 1. Kullanıcıyı oluştur (Davetteki branchId atanır)
    const newUser = await userRepository.createUser({
      name: userData.name,
      surname: userData.surname,
      username: generatedUsername,
      email: userData.email,
      password: "",
      branchId: authorized.branchId,
    });

    // 2. Beyaz listede önceden belirlenen rolü UserRole tablosuna ekle
    await userRepository.assignRoleToUser(newUser.id, authorized.roleId);

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
        newUser.username,
        setupToken,
      );

      // Beyaz liste durumunu tamamlandı olarak işaretle
      await userRepository.markAuthorizedAsCompleted(userData.email);
    } catch (mailError: any) {
      await userRepository.deleteUser(newUser.id).catch(() => {});
      await redis.del(`reset_token:${setupToken}`).catch(() => {});
      throw new Error("E-posta gönderimi başarısız oldu.");
    }

    return {
      id: newUser.id,
      name: newUser.name,
      surname: newUser.surname,
      username: newUser.username,
      email: newUser.email,
      role: authorized.role.name,
      message: "Personel kaydı başarıyla tamamlandı.",
    };
  }

  private async resolveUserPermissions(userId: string) {
    const userRoleRecord = await userRepository.getUserRole(userId);
    if (!userRoleRecord) {
      throw new Error(
        "Hesabınıza henüz bir rol atanmamıştır. Yöneticinizin onaylaması bekleniyor.",
      );
    }

    const roleName = userRoleRecord.role.name;
    const rolePermissions = await userRepository.getRolePermissions(
      userRoleRecord.roleId,
    );
    const rolePermCodes = rolePermissions.map((rp) => rp.permission.code);

    const extraPermissions =
      await userRepository.getUserSpecificPermissions(userId);
    const extraPermCodes = extraPermissions.map((up) => up.permission.code);

    const permissions = Array.from(
      new Set([...rolePermCodes, ...extraPermCodes]),
    );

    return { roleName, permissions };
  }

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

    const { roleName, permissions } = await this.resolveUserPermissions(
      user.id,
    );

    const payload = {
      id: user.id,
      username: user.username,
      name: user.name,
      surname: user.surname,
      role: roleName,
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
        email: user.email,
        role: [roleName],
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

    const { roleName, permissions } = await this.resolveUserPermissions(
      user.id,
    );

    const accessToken = jwt.sign(
      {
        id: user.id,
        username: user.username,
        name: user.name,
        surname: user.surname,
        role: roleName,
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
    if (!token) {
      throw new Error("Geçersiz veya eksik token.");
    }

    const cleanToken = token.trim();
    const username = await redis.get(`reset_token:${cleanToken}`);

    if (!username) {
      throw new Error("Bağlantının süresi dolmuş veya geçersiz.");
    }

    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      throw new Error(validation.message);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await userRepository.updatePassword(username, hashedPassword);

    await redis.del(`reset_token:${cleanToken}`);
  }

  async getAuthorizedPersonnelList() {
    return await userRepository.getAuthorizedPersonnelList();
  }
}

export default new AuthService();
