import { Router } from "express";
import authController from "../controllers/authController";
import { authenticateToken } from "../middlewares/authMiddleware";

const router = Router();

router.post("/login", (req, res) => authController.login(req, res));
router.post("/refresh", authController.refresh);
router.get("/me", authenticateToken, authController.getMe);
router.post("/register", (req, res) => authController.register(req, res));
router.post("/logout", (req, res) => authController.logout(req, res));

// Beyaz listeye rol seçerek personel ekleme rotası
router.post("/authorized-personnel", (req, res) =>
  authController.addAuthorizedPersonnel(req, res),
);

// Şifre sıfırlama rotaları
router.post("/forgot-password", (req, res) =>
  authController.forgotPassword(req, res),
);
router.post("/reset-password", (req, res) =>
  authController.resetPassword(req, res),
);

export default router;
