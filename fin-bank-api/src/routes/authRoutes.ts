import { Router } from "express";
import authController from "../controllers/authController";
import { authenticateToken } from "../middlewares/authMiddleware";

const router = Router();

router.post("/login", (req, res) => authController.login(req, res));
router.post("/refresh", authController.refresh);
//middlewasre de çözüyor tokenın geçerli olup olmadığını
router.get("/me", authenticateToken, authController.getMe);

export default router;
