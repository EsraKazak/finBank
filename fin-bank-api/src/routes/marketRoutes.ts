import { Router } from "express";
import { getCbrtRatesHandler } from "../controllers/marketController";
import { authenticateToken } from "../middlewares/authMiddleware";

const router = Router();

// Giriş yapmış tüm personelin piyasa faizlerini görmesine izin verilir
router.use(authenticateToken);
router.get("/cbrt-rates", getCbrtRatesHandler);

export default router;
