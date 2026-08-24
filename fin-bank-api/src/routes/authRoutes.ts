import { Router } from "express";
import authController from "../controllers/authController";
import {
  authenticateToken,
  requirePermission,
} from "../middlewares/authMiddleware";

const router = Router();

// Herkese açık rotalar
router.post("/login", (req, res) => authController.login(req, res));
router.post("/register", (req, res) => authController.register(req, res));
router.post("/refresh", authController.refresh);
router.post("/logout", (req, res) => authController.logout(req, res));
router.post("/forgot-password", (req, res) =>
  authController.forgotPassword(req, res),
);
router.post("/reset-password", (req, res) =>
  authController.resetPassword(req, res),
);

// Oturum gerektiren rota
router.get("/me", authenticateToken, authController.getMe);

// Beyaz liste rotaları (Sadece yetkili personel/yönetici)
router.post(
  "/authorized-personnel",
  authenticateToken,
  requirePermission("personel:yonetimi"),
  (req, res) => authController.addAuthorizedPersonnel(req, res),
);

router.get(
  "/authorized-personnel",
  authenticateToken,
  requirePermission("personel:yonetimi"),
  (req, res) => authController.getAuthorizedPersonnelList(req, res),
);

export default router;
