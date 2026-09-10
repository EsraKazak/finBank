import { Router } from "express";
import {
  createCustomerHandler,
  getCustomersHandler,
} from "../controllers/customerController";
import { authenticateToken } from "../middlewares/authMiddleware";
import { requirePermission } from "../middlewares/permissionMiddleware";
import prisma from "../config/prisma";

const router = Router();
router.use(authenticateToken);

// Şubeleri listeleyen yardımcı endpoint
router.get("/branches", async (_req, res) => {
  const branches = await prisma.branch.findMany({
    where: { isActive: true },
    orderBy: { code: "asc" },
  });
  return res.json({ success: true, data: branches });
});

// Sadece 'musteri:yonet' yetkisi olanlar yeni müşteri açabilir:
router.post("/", requirePermission("musteri:yonet"), createCustomerHandler);

// 'musteri:goruntule' yetkisi olanlar (Gişe Yetkilisi dahil) listeleyebilir:
router.get("/", requirePermission("musteri:goruntule"), getCustomersHandler);

export default router;
