import { Request, Response } from "express";
import authService from "../services/authService";

class AuthController {
  async login(req: Request, res: Response) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res
          .status(400)
          .json({ message: "Kullanıcı adı ve şifre zorunludur." });
      }

      const result = await authService.login(username, password);
      return res.status(200).json(result);
    } catch (error: any) {
      return res
        .status(401)
        .json({ message: error.message || "Giriş başarısız." });
    }
  }

  async refresh(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({ message: "Refresh token zorunludur." });
      }

      const result = await authService.refreshAccessToken(refreshToken);
      return res.status(200).json(result); // { accessToken: "yeni_token" } döner
    } catch (error: any) {
      // Refresh token geçersizse veya süresi dolmuşsa 401 Unauthorized dönüyoruz
      return res.status(401).json({ message: error.message });
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
}

export default new AuthController();
