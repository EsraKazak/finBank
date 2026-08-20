import { Request, Response } from "express";
import authService from "../services/authService";
import { MailService } from "../services/mailService";

class AuthController {
  async register(req: Request, res: Response) {
    try {
      const { name, surname, username, email, password, role } = req.body;

      if (!name || !surname || !username || !email || !password) {
        return res.status(400).json({
          message:
            "Lütfen ad, soyad, kullanıcı adı, e-posta ve şifre alanlarını doldurun.",
        });
      }

      const newUser = await authService.register({
        name,
        surname,
        username,
        email,
        password,
        role: role || "BANKO_ASISTANI",
      });

      // Kullanıcı oluştuktan sonra hoş geldin mailini gönderiyoruz:
      const fullName = `${name} ${surname}`;
      MailService.sendWelcomeEmail(email, fullName, username, password);

      return res.status(201).json({
        message: "Personel kaydı başarıyla oluşturuldu.",
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
        httpOnly: true, // JavaScript (XSS) ile okunamaz
        secure: process.env.NODE_ENV === "production", // Sadece HTTPS'de gönderilsin
        sameSite: "lax", // CSRF koruması
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 gün
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
      return res.status(200).json(result); // { accessToken: "yeni_token" } döner
    } catch (error: any) {
      // Refresh token geçersizse veya süresi dolmuşsa 401 Unauthorized dönüyoruz
      return res.status(401).json({ message: error.message });
    }
  }

  // Çıkış Yapma (Cookie ve Redis oturumunu temizleme)
  async logout(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (refreshToken) {
        await authService.logout(refreshToken);
      }

      // Tarayıcıdaki cookie'yi sıfırla
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

  // Mevcut login ve refresh fonksiyonlarının yanına:
  async getMe(req: any, res: Response) {
    try {
      // authMiddleware req.user içine token'dan çözdüğü payload'u koyar
      return res.status(200).json({ user: req.user });
    } catch (error: any) {
      return res
        .status(401)
        .json({ message: "Kullanıcı bilgisi doğrulanamadı." });
    }
  }

  // unutulan veya yenilenmek istenen şifre için
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
