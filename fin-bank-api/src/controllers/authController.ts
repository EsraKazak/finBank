import { Request, Response } from "express";
import authService from "../services/authService";

class AuthController {
  async register(req: Request, res: Response) {
    try {
      const { name, surname, username, email, role } = req.body;

      if (!name || !surname || !username || !email) {
        return res.status(400).json({
          message:
            "Lütfen ad, soyad, kullanıcı adı ve e-posta alanlarını doldurun.",
        });
      }

      const newUser = await authService.register({
        name,
        surname,
        username,
        email,
      });

      return res.status(201).json({
        message:
          "Personel kaydı başarıyla oluşturuldu. Şifre belirleme daveti e-posta adresine gönderildi.",
        user: newUser,
      });
    } catch (error: any) {
      return res
        .status(400)
        .json({ message: error.message || "Kayıt sırasında bir hata oluştu." });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res
          .status(400)
          .json({ message: "Kullanıcı adı ve şifre zorunludur." });
      }

      const result = await authService.login(username, password);

      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res
        .status(200)
        .json({ accessToken: result.accessToken, user: result.user });
    } catch (error: any) {
      return res
        .status(401)
        .json({ message: error.message || "Giriş başarısız." });
    }
  }

  async refresh(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) {
        return res
          .status(400)
          .json({ message: "Oturum süresi dolmuş veya cookie bulunamadı." });
      }

      const result = await authService.refreshAccessToken(refreshToken);
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(401).json({ message: error.message });
    }
  }

  async logout(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (refreshToken) {
        await authService.logout(refreshToken);
      }

      res.clearCookie("refreshToken", {
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
      });

      return res.status(200).json({ message: "Başarıyla çıkış yapıldı." });
    } catch (error: any) {
      return res
        .status(500)
        .json({ message: "Çıkış yapılırken bir hata oluştu." });
    }
  }

  async getMe(req: any, res: Response) {
    try {
      return res.status(200).json({ user: req.user });
    } catch (error: any) {
      return res
        .status(401)
        .json({ message: "Kullanıcı bilgisi doğrulanamadı." });
    }
  }

  async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;
      if (!email) {
        return res
          .status(400)
          .json({ message: "Lütfen e-posta adresinizi girin." });
      }

      await authService.forgotPassword(email);
      return res.status(200).json({
        message: "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.",
      });
    } catch (error: any) {
      return res
        .status(400)
        .json({ message: error.message || "İşlem başarısız." });
    }
  }

  async resetPassword(req: Request, res: Response) {
    try {
      const { token, password } = req.body;
      if (!token || !password) {
        return res
          .status(400)
          .json({ message: "Geçersiz istek. Token ve yeni şifre zorunludur." });
      }

      await authService.resetPassword(token, password);
      return res.status(200).json({
        message:
          "Şifreniz başarıyla güncellendi. Yeni şifrenizle giriş yapabilirsiniz.",
      });
    } catch (error: any) {
      return res
        .status(400)
        .json({ message: error.message || "İşlem başarısız." });
    }
  }
}

export default new AuthController();
