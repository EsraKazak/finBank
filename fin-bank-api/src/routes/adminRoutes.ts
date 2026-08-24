import { Router } from "express";
import adminController from "../controllers/adminController";
import {
  authenticateToken,
  requirePermission,
} from "../middlewares/authMiddleware";

const router = Router();

// Tüm admin rotaları için token ve 'personel:yonetimi' yetkisi zorunludur
router.use(authenticateToken);
router.use(requirePermission("personel:yonetimi"));

router.get("/users", adminController.getUsers);
router.get("/roles-permissions", adminController.getRolesAndPermissions);
router.post("/assign-role", adminController.assignRole);
router.post("/assign-permissions", adminController.assignExtraPermissions);

export default router;
