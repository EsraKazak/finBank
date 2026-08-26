import { Router } from "express";
import {
  createCustomerHandler,
  getCustomersHandler,
} from "../controllers/customerController";
import { authenticateToken } from "../middlewares/authMiddleware";
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

router.post("/", createCustomerHandler);
router.get("/", getCustomersHandler);

export default router;
