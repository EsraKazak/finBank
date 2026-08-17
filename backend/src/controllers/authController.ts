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
}

export default new AuthController();
